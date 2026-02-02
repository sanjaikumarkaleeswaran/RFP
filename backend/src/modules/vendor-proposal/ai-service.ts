/**
 * Enhanced AI Service for PDF Analysis
 * Provides advanced AI capabilities with retry logic, caching, and error handling
 */

import { HfInference } from '@huggingface/inference';
import pdfParse from 'pdf-parse';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

interface AIAnalysisOptions {
    maxRetries?: number;
    temperature?: number;
    maxTokens?: number;
    useCache?: boolean;
}

interface PDFExtractionResult {
    text: string;
    numPages: number;
    metadata: any;
    success: boolean;
    error?: string;
}

interface ImageAnalysisResult {
    caption: string;
    ocrText?: string;
    success: boolean;
    error?: string;
}

interface StructuredProposalData {
    pricing?: {
        total?: number;
        currency?: string;
        breakdown?: Array<{ item: string; amount: number }>;
    };
    timeline?: {
        deliveryDate?: string;
        leadTime?: string;
        milestones?: Array<{ phase: string; date: string }>;
    };
    terms?: {
        paymentTerms?: string;
        warranty?: string;
        validity?: string;
        cancellationPolicy?: string;
    };
    compliance?: {
        certifications?: string[];
        standards?: string[];
        licenses?: string[];
    };
    technical?: {
        technologies?: string[];
        team?: string[];
        methodology?: string;
    };
}

export class EnhancedAIService {
    private cache: Map<string, any> = new Map();
    private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

    /**
     * Extract text from PDF with enhanced error handling
     */
    async extractPDFText(buffer: Buffer): Promise<PDFExtractionResult> {
        try {
            const pdfData = await pdfParse(buffer);

            return {
                text: pdfData.text,
                numPages: pdfData.numpages,
                metadata: pdfData.info,
                success: true
            };
        } catch (error) {
            console.error('PDF extraction error:', error);
            return {
                text: '',
                numPages: 0,
                metadata: {},
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Analyze image with multiple fallback strategies
     */
    async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
        try {
            // Primary: Image captioning with BLIP
            const captionResult = await hf.imageToText({
                data: imageBuffer,
                model: 'Salesforce/blip-image-captioning-large'
            });

            const result: ImageAnalysisResult = {
                caption: captionResult.generated_text || 'No caption generated',
                success: true
            };

            // Secondary: Try OCR for text extraction
            try {
                const ocrResult = await hf.imageToText({
                    data: imageBuffer,
                    model: 'microsoft/trocr-base-printed'
                });
                result.ocrText = ocrResult.generated_text;
            } catch (ocrError) {
                console.log('OCR fallback failed, continuing with caption only');
            }

            return result;

        } catch (error) {
            console.error('Image analysis error:', error);
            return {
                caption: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Perform AI analysis with retry logic
     */
    async analyzeWithRetry(
        prompt: string,
        systemPrompt: string,
        options: AIAnalysisOptions = {}
    ): Promise<any> {
        const {
            maxRetries = 3,
            temperature = 0.3,
            maxTokens = 2000,
            useCache = true
        } = options;

        // Check cache
        const cacheKey = this.generateCacheKey(prompt, systemPrompt);
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                console.log('✅ Returning cached AI response');
                return cached.data;
            }
        }

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🤖 AI Analysis attempt ${attempt}/${maxRetries}`);

                const result = await hf.chatCompletion({
                    model: 'mistralai/Mistral-7B-Instruct-v0.3',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: maxTokens,
                    temperature
                });

                const responseText = result.choices[0]?.message?.content || '{}';

                // Try to extract JSON
                const jsonMatch = responseText.match(/\{[\s\S]*\}/) || responseText.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in AI response');
                }

                const parsedData = JSON.parse(jsonMatch[0]);

                // Cache the result
                if (useCache) {
                    this.cache.set(cacheKey, {
                        data: parsedData,
                        timestamp: Date.now()
                    });
                }

                console.log('✅ AI analysis successful');
                return parsedData;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.error(`❌ AI analysis attempt ${attempt} failed:`, lastError.message);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        // All retries failed
        throw lastError || new Error('AI analysis failed after all retries');
    }

    /**
     * Extract structured data from proposal text
     */
    extractStructuredData(text: string): StructuredProposalData {
        const data: StructuredProposalData = {};

        // Extract pricing
        const pricePatterns = [
            /(?:total|price|cost)[:\s]+\$?([0-9,]+(?:\.[0-9]{2})?)/i,
            /\$([0-9,]+(?:\.[0-9]{2})?)/,
        ];

        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                data.pricing = {
                    total: parseFloat(match[1].replace(/,/g, '')),
                    currency: 'USD'
                };
                break;
            }
        }

        // Extract dates
        const datePatterns = [
            /(?:delivery|completion|deadline)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
            /(\d{4}-\d{2}-\d{2})/,
            /(\d{1,2}\/\d{1,2}\/\d{4})/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                data.timeline = {
                    deliveryDate: match[1]
                };
                break;
            }
        }

        // Extract timeline duration
        const durationMatch = text.match(/(\d+)\s*(weeks?|months?|days?)/i);
        if (durationMatch && data.timeline) {
            data.timeline.leadTime = `${durationMatch[1]} ${durationMatch[2]}`;
        }

        // Extract payment terms
        const paymentMatch = text.match(/payment[:\s]+([^.]+)/i);
        if (paymentMatch) {
            data.terms = {
                paymentTerms: paymentMatch[1].trim()
            };
        }

        // Extract warranty
        const warrantyMatch = text.match(/warranty[:\s]+([^.]+)/i);
        if (warrantyMatch) {
            if (!data.terms) data.terms = {};
            data.terms.warranty = warrantyMatch[1].trim();
        }

        // Extract certifications
        const certPatterns = [
            /ISO\s*\d+/gi,
            /SOC\s*\d+/gi,
            /GDPR/gi,
            /HIPAA/gi
        ];

        const certifications: string[] = [];
        for (const pattern of certPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                certifications.push(...matches);
            }
        }

        if (certifications.length > 0) {
            data.compliance = {
                certifications: [...new Set(certifications)]
            };
        }

        // Extract technologies
        const techKeywords = [
            'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java',
            'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'GCP',
            'Docker', 'Kubernetes', 'TypeScript', 'JavaScript'
        ];

        const technologies: string[] = [];
        for (const tech of techKeywords) {
            if (text.includes(tech)) {
                technologies.push(tech);
            }
        }

        if (technologies.length > 0) {
            data.technical = {
                technologies: [...new Set(technologies)]
            };
        }

        return data;
    }

    /**
     * Analyze proposal comprehensively
     */
    async analyzeProposal(
        content: string,
        spaceRequirements: any,
        vendorInfo: any
    ): Promise<any> {
        const systemPrompt = `You are an expert RFP evaluator with deep knowledge of procurement, vendor assessment, and proposal analysis. 
You provide detailed, objective analysis with specific evidence from proposals.
Always respond with valid JSON only, no additional text.`;

        const prompt = `Analyze this vendor proposal comprehensively.

SPACE REQUIREMENTS:
${JSON.stringify(spaceRequirements, null, 2)}

VENDOR INFORMATION:
${JSON.stringify(vendorInfo, null, 2)}

PROPOSAL CONTENT:
${content.substring(0, 4000)}${content.length > 4000 ? '...(truncated)' : ''}

Provide a detailed analysis in this EXACT JSON format:
{
  "personalFeedback": "A personalized message to this vendor about their proposal - be specific and constructive",
  "overallScore": <0-100>,
  "criteriaAnalysis": [
    {
      "criteriaName": "Price Competitiveness",
      "score": <0-10>,
      "feedback": "detailed feedback with specific numbers",
      "evidence": "direct quote from proposal"
    },
    {
      "criteriaName": "Timeline Adherence",
      "score": <0-10>,
      "feedback": "detailed feedback",
      "evidence": "direct quote"
    },
    {
      "criteriaName": "Technical Capability",
      "score": <0-10>,
      "feedback": "detailed feedback",
      "evidence": "direct quote"
    },
    {
      "criteriaName": "Compliance & Certifications",
      "score": <0-10>,
      "feedback": "detailed feedback",
      "evidence": "direct quote"
    }
  ],
  "aiSummary": "brief 2-3 sentence overall summary",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "extractedData": {
    "pricing": {
      "total": <number>,
      "currency": "USD",
      "breakdown": [{"item": "string", "amount": <number>}]
    },
    "timeline": {
      "deliveryDate": "YYYY-MM-DD",
      "leadTime": "X weeks/months"
    },
    "terms": {
      "paymentTerms": "string",
      "warranty": "string"
    },
    "compliance": {
      "certifications": ["cert1", "cert2"],
      "standards": ["standard1"]
    }
  }
}

Respond ONLY with the JSON, no other text.`;

        try {
            const analysis = await this.analyzeWithRetry(prompt, systemPrompt, {
                maxTokens: 2500,
                temperature: 0.3
            });

            // Merge with extracted structured data
            const extractedData = this.extractStructuredData(content);
            analysis.extractedData = {
                ...extractedData,
                ...analysis.extractedData
            };

            return analysis;

        } catch (error) {
            console.error('Proposal analysis failed:', error);

            // Return fallback analysis
            return this.getFallbackAnalysis(content);
        }
    }

    /**
     * Compare multiple proposals
     */
    async compareProposals(
        proposals: any[],
        spaceRequirements: any
    ): Promise<any[]> {
        const systemPrompt = `You are an expert procurement advisor who compares vendor proposals objectively.
You provide clear rankings with specific reasoning based on evidence.
Always respond with valid JSON array only, no additional text.`;

        const proposalsSummary = proposals.map((p, idx) => ({
            index: idx,
            vendor: p.vendorId?.name || 'Unknown',
            score: p.overallScore || 0,
            summary: p.aiSummary || 'No summary',
            pricing: p.extractedData?.pricing,
            timeline: p.extractedData?.timeline,
            strengths: p.strengths || [],
            weaknesses: p.weaknesses || []
        }));

        const prompt = `Compare these vendor proposals and provide rankings.

REQUIREMENTS:
${JSON.stringify(spaceRequirements, null, 2)}

PROPOSALS:
${JSON.stringify(proposalsSummary, null, 2)}

Provide recommendations in this EXACT JSON format:
[
  {
    "rank": 1,
    "isRecommended": true,
    "reasoning": "Specific reasons why this vendor is ranked #1 with evidence",
    "comparisonNotes": "How this vendor compares to others with specific metrics",
    "riskFactors": ["specific risk 1", "specific risk 2"]
  },
  {
    "rank": 2,
    "isRecommended": false,
    "reasoning": "Specific reasons for this ranking",
    "comparisonNotes": "Comparison to top vendor",
    "riskFactors": ["risk 1"]
  }
]

Rank from best (1) to worst. Mark only top 1-2 as recommended.
Respond ONLY with the JSON array, no other text.`;

        try {
            const recommendations = await this.analyzeWithRetry(prompt, systemPrompt, {
                maxTokens: 2000,
                temperature: 0.3
            });

            return Array.isArray(recommendations) ? recommendations : [];

        } catch (error) {
            console.error('Comparison analysis failed:', error);

            // Return fallback rankings
            return proposals.map((p, idx) => ({
                rank: idx + 1,
                isRecommended: idx === 0,
                reasoning: idx === 0 ? 'Highest overall score' : 'Lower score than top candidate',
                comparisonNotes: 'Manual review recommended',
                riskFactors: []
            }));
        }
    }

    /**
     * Generate fallback analysis when AI fails
     */
    private getFallbackAnalysis(content: string): any {
        const extractedData = this.extractStructuredData(content);

        return {
            overallScore: 50,
            personalFeedback: 'Thank you for your proposal. We are currently reviewing it and will get back to you soon.',
            criteriaAnalysis: [
                {
                    criteriaName: 'General Response',
                    score: 5,
                    feedback: 'Proposal received and under review',
                    evidence: 'Manual analysis required'
                }
            ],
            aiSummary: 'Proposal received. Automated analysis unavailable - manual review in progress.',
            strengths: ['Response received', 'Proposal submitted on time'],
            weaknesses: ['Automated analysis unavailable'],
            extractedData
        };
    }

    /**
     * Generate cache key
     */
    private generateCacheKey(prompt: string, systemPrompt: string): string {
        const combined = prompt + systemPrompt;
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `ai_${hash}`;
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('✅ AI cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export const enhancedAIService = new EnhancedAIService();
