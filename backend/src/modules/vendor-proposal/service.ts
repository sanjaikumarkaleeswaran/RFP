import { VendorProposal, IVendorProposal, IAttachmentAnalysis } from './model';
import { Email } from '../email/model';
import { Space } from '../space/model';
import { Vendor } from '../vendor/model';
import mongoose from 'mongoose';
import { HfInference } from '@huggingface/inference';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number; info: any }>;
import { google } from 'googleapis';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

export class VendorProposalService {
    /**
     * Analyze a vendor's reply email and create/update their proposal
     */
    async analyzeVendorReply(emailId: string): Promise<IVendorProposal> {
        const email = await Email.findById(emailId)
            .populate('vendorId')
            .populate('spaceId');

        if (!email) {
            throw new Error('Email not found');
        }

        if (!email.vendorId || !email.spaceId) {
            throw new Error('Email must be associated with a vendor and space');
        }

        const space = await Space.findById(email.spaceId);
        if (!space) {
            throw new Error('Space not found');
        }

        const vendor = await Vendor.findById(email.vendorId);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        // Get or create vendor proposal
        let proposal = await VendorProposal.findOne({
            spaceId: email.spaceId,
            vendorId: email.vendorId
        });

        const isUpdate = !!proposal;

        if (!proposal) {
            proposal = new VendorProposal({
                spaceId: email.spaceId,
                vendorId: email.vendorId,
                emailId: email._id,
                status: 'pending'
            });
        } else {
            // Update to latest email
            proposal.emailId = email._id as mongoose.Types.ObjectId;
        }

        // Analyze attachments if present
        const attachmentAnalyses: IAttachmentAnalysis[] = [];
        if (email.attachments && email.attachments.length > 0) {
            for (const attachment of email.attachments) {
                try {
                    const analysis = await this.analyzeAttachment(
                        attachment,
                        space.structuredData,
                        email
                    );
                    attachmentAnalyses.push(analysis);
                } catch (error) {
                    console.error(`Failed to analyze attachment ${attachment.filename}:`, error);
                }
            }
        }

        // Perform AI analysis
        const analysis = await this.performAIAnalysis(
            email,
            space,
            vendor,
            attachmentAnalyses
        );

        // Update proposal with analysis results
        proposal.personalFeedback = analysis.personalFeedback || analysis.aiSummary;
        proposal.overallScore = analysis.overallScore;
        proposal.criteriaAnalysis = analysis.criteriaAnalysis;
        proposal.aiSummary = analysis.aiSummary;
        proposal.strengths = analysis.strengths;
        proposal.weaknesses = analysis.weaknesses;
        proposal.extractedData = analysis.extractedData;
        proposal.attachmentAnalyses = attachmentAnalyses;
        proposal.status = 'analyzed';

        // Add to reply history
        proposal.replyHistory.push({
            emailId: email._id as mongoose.Types.ObjectId,
            analyzedAt: new Date(),
            score: analysis.overallScore
        });

        await proposal.save();

        console.log(`✅ ${isUpdate ? 'Updated' : 'Created'} proposal analysis for vendor ${vendor.name} in space ${space.name}`);

        return proposal;
    }

    /**
     * Analyze an attachment (PDF or image)
     */
    private async analyzeAttachment(
        attachment: any,
        spaceStructuredData: any,
        email: any
    ): Promise<IAttachmentAnalysis> {
        const analysisType = this.getAttachmentAnalysisType(attachment.mimeType);

        const analysis: IAttachmentAnalysis = {
            attachmentId: attachment.attachmentId || attachment._id?.toString() || '',
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            analysisType,
            analyzedAt: new Date()
        };

        if (analysisType === 'other') {
            analysis.insights = 'Unsupported file type for AI analysis';
            return analysis;
        }

        try {
            console.log(`📎 Analyzing ${analysisType}: ${attachment.filename}`);

            // Step 1: Fetch attachment from Gmail API
            const attachmentBuffer = await this.fetchAttachmentFromGmail(
                email.gmailMessageId,
                attachment.attachmentId
            );

            let extractedContent = '';

            // Step 2: Extract content based on type
            if (analysisType === 'pdf') {
                // Extract text from PDF using pdf-parse
                console.log('   Extracting text from PDF...');
                const pdfData = await pdfParse(attachmentBuffer);
                extractedContent = pdfData.text;
                analysis.extractedText = extractedContent;
                console.log(`   ✅ Extracted ${extractedContent.length} characters from PDF`);

            } else if (analysisType === 'image') {
                // Analyze image using Hugging Face Vision model
                console.log('   Analyzing image with Hugging Face...');
                const imageAnalysis = await this.analyzeImageWithHF(attachmentBuffer);
                extractedContent = imageAnalysis;
                analysis.extractedText = imageAnalysis;
                console.log(`   ✅ Image analysis complete`);
            }

            // Step 3: Analyze extracted content with Mistral 3
            if (extractedContent) {
                console.log('   Analyzing content with Mistral 3...');
                const prompt = `Analyze this ${analysisType} content from an RFP proposal attachment.

Space Requirements: ${JSON.stringify(spaceStructuredData, null, 2)}

Content from ${attachment.filename}:
${extractedContent.substring(0, 3000)} ${extractedContent.length > 3000 ? '...(truncated)' : ''}

Please extract and summarize:
1. Pricing information (itemized if available)
2. Timeline and delivery dates
3. Terms and conditions
4. Technical specifications
5. Compliance and certifications
6. Any other relevant proposal details

Provide a clear, structured summary.`;

                const result = await hf.chatCompletion({
                    model: 'mistralai/Mistral-7B-Instruct-v0.3',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert at analyzing RFP proposal documents. Extract key information clearly and concisely.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                });

                const aiAnalysis = result.choices[0]?.message?.content || 'No analysis available';
                analysis.insights = this.extractInsightsFromText(aiAnalysis);
                analysis.extractedData = this.extractStructuredDataFromText(aiAnalysis);

                console.log('   ✅ AI analysis complete');
            }

        } catch (error) {
            console.error(`❌ Attachment analysis error for ${attachment.filename}:`, error);
            analysis.insights = `Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        return analysis;
    }

    /**
     * Fetch attachment from Gmail API
     */
    private async fetchAttachmentFromGmail(
        gmailMessageId: string,
        attachmentId: string
    ): Promise<Buffer> {
        try {
            // Get OAuth2 client (you'll need to pass this from the email's user)
            // For now, using the service account or user's stored credentials
            const gmail = google.gmail({ version: 'v1' });

            const attachment = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: gmailMessageId,
                id: attachmentId,
                // You'll need to pass auth here - get it from the user's stored credentials
            } as any);

            // Convert base64url to Buffer
            const buffer = Buffer.from(attachment.data.data || '', 'base64url');
            return buffer;

        } catch (error) {
            console.error('Error fetching attachment from Gmail:', error);
            throw new Error(`Failed to fetch attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Analyze image using Hugging Face Vision model
     */
    private async analyzeImageWithHF(imageBuffer: Buffer): Promise<string> {
        try {
            // Use Hugging Face image-to-text model
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await hf.imageToText({
                data: new Blob([imageBuffer as any]),
                model: 'Salesforce/blip-image-captioning-large'
            });

            return result.generated_text || 'No text detected in image';

        } catch (error) {
            console.error('Error analyzing image with HF:', error);

            // Fallback: Try OCR model
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const ocrResult = await hf.imageToText({
                    data: new Blob([imageBuffer as any]),
                    model: 'microsoft/trocr-base-printed'
                });
                return ocrResult.generated_text || 'No text detected';
            } catch (ocrError) {
                return 'Image analysis failed';
            }
        }
    }

    /**
     * Determine attachment analysis type
     */
    private getAttachmentAnalysisType(mimeType: string): 'pdf' | 'image' | 'other' {
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.startsWith('image/')) return 'image';
        return 'other';
    }

    /**
     * Extract insights from analyzed text
     */
    private extractInsightsFromText(text: string): string {
        // Simple extraction - take first 500 chars as summary
        return text.substring(0, 500) + (text.length > 500 ? '...' : '');
    }

    /**
     * Extract structured data from AI response
     */
    private extractStructuredDataFromText(text: string): any {
        const data: any = {};

        // Simple pattern matching for common fields
        const priceMatch = text.match(/(?:total|price|cost)[\s:]+\$?([\d,]+(?:\.\d{2})?)/i);
        if (priceMatch) {
            data.pricing = { total: parseFloat(priceMatch[1].replace(/,/g, '')) };
        }

        const dateMatch = text.match(/(?:delivery|completion)[\s:]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
        if (dateMatch) {
            data.timeline = { deliveryDate: dateMatch[1] };
        }

        return data;
    }

    /**
     * Perform comprehensive AI analysis of vendor proposal
     */
    private async performAIAnalysis(
        email: any,
        space: any,
        vendor: any,
        attachmentAnalyses: IAttachmentAnalysis[]
    ): Promise<any> {
        const attachmentContext = attachmentAnalyses.length > 0
            ? `\n\nAttachment Analysis:\n${attachmentAnalyses.map(a =>
                `- ${a.filename}: ${a.insights || 'No insights'}`
            ).join('\n')}`
            : '';

        const prompt = `You are an expert RFP evaluator. Analyze this vendor's proposal response.

SPACE INFORMATION:
Name: ${space.name}
Description: ${space.description || 'N/A'}
Requirements: ${space.requirements || 'N/A'}
Structured Data: ${JSON.stringify(space.structuredData, null, 2)}

VENDOR INFORMATION:
Name: ${vendor.name}
Email: ${vendor.email}
Company: ${vendor.company || 'N/A'}

VENDOR'S REPLY:
Subject: ${email.subject || 'N/A'}
Body: ${email.bodyPlain || email.bodyHtml || 'N/A'}
${attachmentContext}

EVALUATION CRITERIA (based on space structured data):
${this.generateCriteriaFromSpace(space.structuredData)}

Please provide a comprehensive analysis in the following JSON format:
{
  "personalFeedback": "A personalized message to this specific vendor about their proposal - what they did well, what could be improved, and how they compare to requirements",
  "overallScore": <0-100>,
  "criteriaAnalysis": [
    {
      "criteriaName": "string",
      "score": <0-10>,
      "feedback": "detailed feedback",
      "evidence": "quote from proposal"
    }
  ],
  "aiSummary": "brief overall summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "extractedData": {
    "pricing": {
      "total": number,
      "currency": "string",
      "breakdown": [{"item": "string", "amount": number}]
    },
    "timeline": {
      "deliveryDate": "string",
      "leadTime": "string"
    },
    "terms": {
      "paymentTerms": "string",
      "warranty": "string",
      "validity": "string"
    },
    "compliance": {
      "certifications": ["cert1"],
      "standards": ["standard1"]
    }
  }
}

Respond ONLY with valid JSON, no additional text.`;

        try {
            const result = await hf.chatCompletion({
                model: 'mistralai/Mistral-7B-Instruct-v0.3',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert RFP evaluator. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            });
            const responseText = result.choices[0]?.message?.content || '{}';

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }

            const analysis = JSON.parse(jsonMatch[0]);
            return analysis;

        } catch (error) {
            console.error('AI analysis error:', error);

            // Return default analysis on error
            return {
                overallScore: 50,
                criteriaAnalysis: [{
                    criteriaName: 'General Response',
                    score: 5,
                    feedback: 'Unable to perform detailed analysis',
                    evidence: ''
                }],
                aiSummary: 'Analysis failed - manual review required',
                strengths: ['Response received'],
                weaknesses: ['Automated analysis unavailable'],
                extractedData: {}
            };
        }
    }

    /**
     * Generate evaluation criteria from space structured data
     */
    private generateCriteriaFromSpace(structuredData: any): string {
        if (!structuredData) {
            return '- Price competitiveness\n- Delivery timeline\n- Quality of response\n- Compliance with requirements';
        }

        const criteria: string[] = [];

        if (structuredData.budget) {
            criteria.push(`- Budget compliance (target: ${structuredData.budget})`);
        }
        if (structuredData.timeline) {
            criteria.push(`- Timeline adherence (required: ${structuredData.timeline})`);
        }
        if (structuredData.requirements) {
            criteria.push(`- Requirements coverage: ${JSON.stringify(structuredData.requirements)}`);
        }
        if (structuredData.criteria) {
            Object.keys(structuredData.criteria).forEach(key => {
                criteria.push(`- ${key}: ${structuredData.criteria[key]}`);
            });
        }

        return criteria.length > 0 ? criteria.join('\n') : 'General proposal quality';
    }

    /**
     * Compare all proposals for a space and generate AI recommendations
     */
    async compareProposals(spaceId: string): Promise<IVendorProposal[]> {
        const proposals = await VendorProposal.find({ spaceId })
            .populate('vendorId')
            .populate('emailId')
            .sort({ overallScore: -1 });

        if (proposals.length === 0) {
            throw new Error('No proposals found for this space');
        }

        const space = await Space.findById(spaceId);
        if (!space) {
            throw new Error('Space not found');
        }

        // Generate comparative AI recommendations
        const recommendations = await this.generateComparativeRecommendations(
            proposals,
            space
        );

        // Update proposals with recommendations
        for (let i = 0; i < proposals.length; i++) {
            proposals[i].aiRecommendation = recommendations[i];
            await proposals[i].save();
        }

        return proposals;
    }

    /**
     * Generate AI recommendations comparing all vendors
     */
    private async generateComparativeRecommendations(
        proposals: IVendorProposal[],
        space: any
    ): Promise<any[]> {
        const proposalsSummary = proposals.map((p, idx) => ({
            index: idx,
            vendor: (p.vendorId as any).name,
            score: p.overallScore,
            summary: p.aiSummary,
            strengths: p.strengths,
            weaknesses: p.weaknesses,
            pricing: p.extractedData?.pricing,
            timeline: p.extractedData?.timeline
        }));

        const prompt = `You are an expert procurement advisor. Compare these vendor proposals and provide recommendations.

SPACE: ${space.name}
REQUIREMENTS: ${JSON.stringify(space.structuredData, null, 2)}

PROPOSALS:
${JSON.stringify(proposalsSummary, null, 2)}

For each proposal, provide a recommendation in this JSON format:
[
  {
    "rank": 1,
    "isRecommended": true,
    "reasoning": "why this vendor should be selected or rejected",
    "comparisonNotes": "how this compares to other vendors"
  }
]

Rank them from best (1) to worst. Mark only the top 1-2 as recommended.
Respond ONLY with valid JSON array, no additional text.`;

        try {
            const result = await hf.chatCompletion({
                model: 'mistralai/Mistral-7B-Instruct-v0.3',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert procurement advisor. Always respond with valid JSON array only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.3
            });
            const responseText = result.choices[0]?.message?.content || '[]';

            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in AI response');
            }

            return JSON.parse(jsonMatch[0]);

        } catch (error) {
            console.error('Comparison analysis error:', error);

            // Return default recommendations
            return proposals.map((p, idx) => ({
                rank: idx + 1,
                isRecommended: idx === 0,
                reasoning: idx === 0 ? 'Highest score' : 'Lower score than top candidate',
                comparisonNotes: 'Manual review recommended'
            }));
        }
    }

    /**
     * Accept a vendor proposal
     */
    async acceptProposal(proposalId: string, userId: string): Promise<IVendorProposal> {
        const proposal = await VendorProposal.findById(proposalId)
            .populate('vendorId')
            .populate('spaceId');

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        // Reject all other proposals for this space
        await VendorProposal.updateMany(
            {
                spaceId: proposal.spaceId,
                _id: { $ne: proposal._id }
            },
            {
                status: 'rejected',
                rejectionReason: 'Another vendor was selected'
            }
        );

        // Accept this proposal
        proposal.status = 'accepted';
        await proposal.save();

        // Update space status
        await Space.findByIdAndUpdate(proposal.spaceId, {
            status: 'closed'
        });

        // Send acceptance email
        await this.sendAcceptanceEmail(proposal, userId);

        return proposal;
    }

    /**
     * Reject a vendor proposal
     */
    async rejectProposal(
        proposalId: string,
        reason: string,
        userId: string
    ): Promise<IVendorProposal> {
        const proposal = await VendorProposal.findById(proposalId)
            .populate('vendorId')
            .populate('spaceId');

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        proposal.status = 'rejected';
        proposal.rejectionReason = reason;
        await proposal.save();

        // Send rejection email
        await this.sendRejectionEmail(proposal, reason, userId);

        return proposal;
    }

    /**
     * Send acceptance email to vendor
     */
    private async sendAcceptanceEmail(proposal: any, userId: string): Promise<void> {
        const vendor = proposal.vendorId;
        const space = proposal.spaceId;

        const email = new Email({
            userId,
            spaceId: space._id,
            vendorId: vendor._id,
            from: {
                email: process.env.SMTP_FROM_EMAIL || 'noreply@rfp.com',
                name: 'RFP System'
            },
            to: [{
                email: vendor.email,
                name: vendor.name
            }],
            subject: `Proposal Accepted - ${space.name}`,
            bodyPlain: `Dear ${vendor.name},

Congratulations! Your proposal for "${space.name}" has been accepted.

We were impressed by your submission and look forward to working with you.

Next Steps:
- Our team will contact you within 2 business days
- Please prepare the necessary documentation
- We'll schedule a kickoff meeting

Thank you for your proposal.

Best regards,
RFP Management Team`,
            bodyHtml: `<p>Dear ${vendor.name},</p>
<p><strong>Congratulations!</strong> Your proposal for "${space.name}" has been accepted.</p>
<p>We were impressed by your submission and look forward to working with you.</p>
<h3>Next Steps:</h3>
<ul>
<li>Our team will contact you within 2 business days</li>
<li>Please prepare the necessary documentation</li>
<li>We'll schedule a kickoff meeting</li>
</ul>
<p>Thank you for your proposal.</p>
<p>Best regards,<br>RFP Management Team</p>`,
            direction: 'outbound',
            provider: 'smtp',
            deliveryStatus: 'pending'
        });

        await email.save();
        console.log(`✅ Acceptance email queued for ${vendor.email}`);
    }

    /**
     * Send rejection email to vendor
     */
    private async sendRejectionEmail(
        proposal: any,
        reason: string,
        userId: string
    ): Promise<void> {
        const vendor = proposal.vendorId;
        const space = proposal.spaceId;

        const email = new Email({
            userId,
            spaceId: space._id,
            vendorId: vendor._id,
            from: {
                email: process.env.SMTP_FROM_EMAIL || 'noreply@rfp.com',
                name: 'RFP System'
            },
            to: [{
                email: vendor.email,
                name: vendor.name
            }],
            subject: `Proposal Update - ${space.name}`,
            bodyPlain: `Dear ${vendor.name},

Thank you for submitting your proposal for "${space.name}".

After careful consideration, we have decided to proceed with another vendor for this project.

Reason: ${reason}

We appreciate the time and effort you put into your proposal and hope to work with you on future opportunities.

Best regards,
RFP Management Team`,
            bodyHtml: `<p>Dear ${vendor.name},</p>
<p>Thank you for submitting your proposal for "${space.name}".</p>
<p>After careful consideration, we have decided to proceed with another vendor for this project.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>We appreciate the time and effort you put into your proposal and hope to work with you on future opportunities.</p>
<p>Best regards,<br>RFP Management Team</p>`,
            direction: 'outbound',
            provider: 'smtp',
            deliveryStatus: 'pending'
        });

        await email.save();
        console.log(`✅ Rejection email queued for ${vendor.email}`);
    }

    /**
     * Get all proposals for a space
     */
    async getProposalsBySpace(spaceId: string): Promise<IVendorProposal[]> {
        return await VendorProposal.find({ spaceId })
            .populate('vendorId')
            .populate('emailId')
            .sort({ overallScore: -1 });
    }

    /**
     * Get proposal by vendor and space
     */
    async getProposalByVendor(
        spaceId: string,
        vendorId: string
    ): Promise<IVendorProposal | null> {
        return await VendorProposal.findOne({ spaceId, vendorId })
            .populate('vendorId')
            .populate('emailId');
    }
}

export const vendorProposalService = new VendorProposalService();
