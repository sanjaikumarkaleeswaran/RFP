import { Space, ISpace } from './model';
import { llmService } from '../../common/services/llm.service';

export class SpaceService {
    async createSpace(data: Partial<ISpace>): Promise<ISpace> {
        const space = new Space(data);
        return await space.save();
    }

    async getSpaces(filter: any = {}): Promise<ISpace[]> {
        return await Space.find(filter).sort({ createdAt: -1 });
    }

    async getSpaceById(id: string): Promise<ISpace | null> {
        return await Space.findById(id);
    }

    async updateSpace(id: string, data: Partial<ISpace>): Promise<ISpace | null> {
        return await Space.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteSpace(id: string): Promise<ISpace | null> {
        return await Space.findByIdAndDelete(id);
    }

    /**
     * Parse raw requirements using LLM
     */
    async parseRequirements(spaceId: string, rawRequirements: string): Promise<ISpace | null> {
        // 1. Update space with raw requirements
        const space = await Space.findByIdAndUpdate(spaceId, { requirements: rawRequirements }, { new: true });
        if (!space) return null;

        // 2. Call LLM to parse
        const prompt = `
      Extract the following fields from the requirement text below into a JSON object:
      - items: array of objects with { name, quantity, specs }
      - deliveryDate: string or null
      - warranty: string or null
      - budget: string or null
      - categories: array of strings representing product/service categories (e.g., ["Electronics", "Furniture", "Office Supplies"])
      - otherRequirements: string or null

      Requirement Text:
      "${rawRequirements}"
      
      Important: Extract relevant categories that describe what is being requested. 
      Categories should be general product/service types that vendors might specialize in.
    `;

        try {
            const structuredData: any = await llmService.generateJson(prompt);

            // 3. Save structured data and categories
            space.structuredData = structuredData;

            // Extract and save categories if present
            if (structuredData.categories && Array.isArray(structuredData.categories)) {
                space.categories = structuredData.categories;
            }

            await space.save();
            return space;
        } catch (error) {
            console.error('Failed to parse requirements:', error);
            throw error;
        }
    }

    /**
     * Generate email template using LLM based on structured data
     */
    async generateTemplate(spaceId: string): Promise<ISpace | null> {
        const space = await Space.findById(spaceId);
        if (!space || !space.structuredData) {
            throw new Error('Space not found or no structured data available');
        }

        const prompt = `
      Create a professional RFP email template for vendors based on these requirements:
      ${JSON.stringify(space.structuredData)}

      Use placeholders like {{vendor_name}}, {{company_name}} for dynamic values.
      Return ONLY the email body text.
    `;

        try {
            const template = await llmService.generateText(prompt);
            space.emailTemplate = template;
            await space.save();
            return space;
        } catch (error) {
            console.error('Failed to generate template:', error);
            throw error;
        }
    }

    /**
     * Send RFP to selected vendors via email
     */
    async sendRFPToVendors(
        spaceId: string,
        vendorIds: string[],
        emailContent: string,
        userId: string,
        attachments?: Array<{ filename: string; content: Buffer; mimeType: string }>
    ) {
        const space = await Space.findById(spaceId);
        if (!space) {
            throw new Error('Space not found');
        }

        // Import vendor service and email model
        const { vendorService } = await import('../vendor/service');
        const { Email } = await import('../email/model');

        interface EmailResult {
            vendorId: string;
            vendorName?: string;
            vendorEmail?: string;
            status: 'sent' | 'failed';
            sentAt?: Date;
            emailId?: string;
            error?: string;
        }

        const results: EmailResult[] = [];
        for (const vendorId of vendorIds) {
            const vendor = await vendorService.getVendorById(vendorId);
            if (!vendor) {
                results.push({ vendorId, status: 'failed', error: 'Vendor not found' });
                continue;
            }

            const vendorEmail = vendor.emails && vendor.emails.length > 0 ? vendor.emails[0] : null;
            if (!vendorEmail) {
                results.push({
                    vendorId,
                    vendorName: vendor.name,
                    status: 'failed',
                    error: 'No email address found'
                });
                continue;
            }

            try {
                // Personalize email content for this vendor
                let personalizedContent = emailContent;

                // Replace {{vendor_name}} with actual vendor name
                personalizedContent = personalizedContent.replace(/\{\{vendor_name\}\}/gi, vendor.name);

                // Replace {{company_name}} with actual company name
                personalizedContent = personalizedContent.replace(/\{\{company_name\}\}/gi, vendor.companyName || vendor.name);

                // Send email using SMTP (old reliable way - no OAuth needed!)
                const { smtpEmailService } = await import('../../common/services/smtp-email.service');
                const mongoose = await import('mongoose');

                const emailResult = await smtpEmailService.sendEmail({
                    to: vendorEmail,
                    subject: `RFP - ${space.name}`,
                    html: personalizedContent,
                    userId: space.ownerId || new mongoose.Types.ObjectId(userId),
                    spaceId: space._id,
                    vendorId: new mongoose.Types.ObjectId(vendorId)
                });

                if (emailResult.success) {
                    console.log(`✅ Email sent successfully to ${vendor.name} (${vendorEmail})`);
                    results.push({
                        vendorId,
                        vendorName: vendor.name,
                        vendorEmail: vendorEmail,
                        status: 'sent',
                        sentAt: new Date(),
                        emailId: emailResult.emailId
                    });
                } else {
                    console.error(`❌ Failed to send email to ${vendorEmail}:`, emailResult.error);
                    results.push({
                        vendorId,
                        vendorName: vendor.name,
                        status: 'failed',
                        error: emailResult.error || 'Failed to send email'
                    });
                }
            } catch (error) {
                console.error(`Failed to send email to ${vendorEmail}:`, error);
                results.push({
                    vendorId,
                    vendorName: vendor.name,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return {
            spaceId,
            spaceName: space.name,
            totalVendors: vendorIds.length,
            results
        };
    }

    /**
     * Get email statuses for all vendors in a space
     */
    async getVendorEmailStatuses(spaceId: string) {
        const { Email } = await import('../email/model');
        const { vendorService } = await import('../vendor/service');

        // Get all emails for this space
        const emails = await Email.find({ spaceId }).sort({ createdAt: -1 });

        // Get vendors for this space to map IDs
        const space = await Space.findById(spaceId);
        if (!space) return {};

        const categories = Array.isArray(space.categories) ? space.categories : [];
        const vendors = await vendorService.searchByCategories(categories.map(String));

        const statuses: Record<string, { sent: boolean; sentAt?: Date; received: boolean; receivedAt?: Date }> = {};

        // Initialize statuses
        vendors.forEach(v => {
            statuses[v._id.toString()] = { sent: false, received: false };
        });

        // Map emails to statuses
        for (const email of emails) {
            // Find vendor by email address
            const vendorEmail = email.to[0]?.email || email.from.email;
            const vendor = vendors.find(v => v.emails.includes(vendorEmail));

            if (vendor) {
                const vendorId = vendor._id.toString();
                if (!statuses[vendorId]) {
                    statuses[vendorId] = { sent: false, received: false };
                }

                if (email.direction === 'outbound') {
                    statuses[vendorId].sent = true;
                    statuses[vendorId].sentAt = email.createdAt;
                } else if (email.direction === 'inbound') {
                    statuses[vendorId].received = true;
                    statuses[vendorId].receivedAt = email.createdAt;
                }
            }
        }

        return statuses;
    }

    /**
     * Compare proposals using LLM with comprehensive analysis
     */
    async compareProposals(spaceId: string) {
        const { Email } = await import('../email/model');
        const { vendorService } = await import('../vendor/service');

        // Get the space details
        const space = await Space.findById(spaceId);
        if (!space) {
            throw new Error('Space not found');
        }

        // 1. Get inbound emails (proposals)
        const emails = await Email.find({
            spaceId,
            direction: 'inbound'
        }).sort({ createdAt: -1 });

        if (emails.length === 0) {
            return {
                spaceId,
                spaceName: space.name,
                totalProposals: 0,
                proposals: [],
                comparison: {
                    summary: "No proposals received yet. Proposals will appear here once vendors respond to your RFP.",
                    vendorScores: [],
                    priceComparison: null,
                    recommendation: {
                        recommendedVendor: '',
                        reasoning: 'Waiting for vendor responses.',
                        alternativeOptions: [],
                        riskFactors: []
                    }
                }
            };
        }

        // 2. Prepare data for LLM
        const proposals: any[] = [];
        for (const email of emails) {
            const vendor = await vendorService.getVendorByEmail(email.from.email);
            proposals.push({
                vendorId: vendor?._id.toString() || email._id.toString(),
                vendorName: vendor?.name || email.from.name || 'Unknown Vendor',
                vendorCompany: vendor?.companyName || 'Unknown Company',
                vendorEmail: email.from.email,
                content: email.bodyPlain || email.bodyHtml || 'No content',
                receivedAt: email.createdAt,
                hasAttachments: email.attachments && email.attachments.length > 0
            });
        }

        // 3. Generate comprehensive comparison using LLM
        const prompt = `
You are an expert procurement analyst. Analyze the following vendor proposals for an RFP and provide a comprehensive comparison.

RFP Details:
- Space Name: ${space.name}
- Requirements: ${space.requirements || 'Not specified'}
- Total Proposals Received: ${proposals.length}

Vendor Proposals:
${JSON.stringify(proposals, null, 2)}

Provide a detailed analysis in the following JSON format:
{
  "summary": "A comprehensive 2-3 sentence summary of all proposals received, highlighting key trends and observations",
  "vendorScores": [
    {
      "vendorId": "vendor ID from proposals",
      "vendorName": "vendor name",
      "scores": {
        "priceCompetitiveness": 0-100 (how competitive is their pricing),
        "termsQuality": 0-100 (quality of payment terms, warranties, etc),
        "deliverySpeed": 0-100 (how fast can they deliver),
        "completeness": 0-100 (how complete is their proposal),
        "overallValue": 0-100 (overall value proposition)
      },
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  ],
  "priceComparison": {
    "lowestPrice": {
      "vendorName": "vendor with lowest price",
      "amount": numeric value,
      "currency": "USD" or other currency
    },
    "highestPrice": {
      "vendorName": "vendor with highest price",
      "amount": numeric value,
      "currency": "USD" or other currency
    },
    "averagePrice": numeric average
  },
  "recommendation": {
    "recommendedVendor": "name of recommended vendor",
    "reasoning": "2-3 sentences explaining why this vendor is recommended",
    "alternativeOptions": ["alternative vendor 1 with brief reason", "alternative vendor 2 with brief reason"],
    "riskFactors": ["risk factor 1", "risk factor 2"]
  }
}

Important:
- Be objective and data-driven in your analysis
- If pricing is not mentioned in proposals, estimate scores based on value indicators
- Consider completeness, professionalism, and responsiveness
- Identify any red flags or concerns
- Provide actionable insights
`;

        try {
            const comparison = await llmService.generateJson(prompt);

            return {
                spaceId,
                spaceName: space.name,
                totalProposals: proposals.length,
                proposals,
                comparison
            };
        } catch (error) {
            console.error('Failed to compare proposals:', error);

            // Return a fallback response if LLM fails
            return {
                spaceId,
                spaceName: space.name,
                totalProposals: proposals.length,
                proposals,
                comparison: {
                    summary: `Received ${proposals.length} proposal(s) from vendors. AI analysis temporarily unavailable.`,
                    vendorScores: proposals.map((p, idx) => ({
                        vendorId: p.vendorId,
                        vendorName: p.vendorName,
                        scores: {
                            priceCompetitiveness: 70,
                            termsQuality: 70,
                            deliverySpeed: 70,
                            completeness: 70,
                            overallValue: 70
                        },
                        strengths: ['Proposal received'],
                        weaknesses: ['Analysis pending']
                    })),
                    priceComparison: null,
                    recommendation: {
                        recommendedVendor: proposals[0]?.vendorName || '',
                        reasoning: 'Please review proposals manually. AI analysis is temporarily unavailable.',
                        alternativeOptions: [],
                        riskFactors: ['AI analysis unavailable - manual review recommended']
                    }
                }
            };
        }
    }

    /**
     * Import manual email as proposal
     */
    async importManualEmail(spaceId: string, data: { from: { email: string; name?: string }; subject: string; content: string; vendorId?: string }) {
        const { Email } = await import('../email/model');
        const { vendorService } = await import('../vendor/service');

        const space = await Space.findById(spaceId);
        if (!space) throw new Error('Space not found');

        // Try to find vendor if not provided
        let vendorId = data.vendorId;
        if (!vendorId) {
            const vendor = await vendorService.getVendorByEmail(data.from.email);
            if (vendor) vendorId = vendor._id.toString();
        }

        // Create inbound email record
        const email = await Email.create({
            userId: space.ownerId || new (await import('mongoose')).Types.ObjectId(),
            spaceId: space._id,
            from: {
                email: data.from.email,
                name: data.from.name || 'Unknown'
            },
            to: [{
                email: process.env.FROM_EMAIL || 'me@example.com',
                name: 'Me'
            }],
            subject: data.subject,
            bodyPlain: data.content,
            direction: 'inbound',
            provider: 'manual',
            processed: true,
            receivedAt: new Date()
        });

        return {
            success: true,
            emailId: email._id.toString(),
            vendorId
        };
    }
}

export const spaceService = new SpaceService();
