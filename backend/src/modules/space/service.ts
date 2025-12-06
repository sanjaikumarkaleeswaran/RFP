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
    async sendRFPToVendors(spaceId: string, vendorIds: string[], emailContent: string, userId: string) {
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
                // Send email using Gmail API (NOT SMTP) so webhook can track replies
                const { gmailAPIService } = await import('../../common/services/gmail-api.service');
                const mongoose = await import('mongoose');

                const emailResult = await gmailAPIService.sendEmail(
                    space.ownerId || new mongoose.Types.ObjectId(userId),
                    vendorEmail,
                    `RFP - ${space.name}`,
                    emailContent,
                    undefined, // text (we're using html)
                    space._id
                );

                if (emailResult.success) {
                    console.log(`✅ Email sent successfully to ${vendor.name} (${vendorEmail})`);
                    results.push({
                        vendorId,
                        vendorName: vendor.name,
                        vendorEmail: vendorEmail,
                        status: 'sent',
                        sentAt: new Date(),
                        emailId: emailResult.messageId
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
     * Compare proposals using LLM
     */
    async compareProposals(spaceId: string) {
        const { Email } = await import('../email/model');
        const { vendorService } = await import('../vendor/service');

        // 1. Get inbound emails (proposals)
        const emails = await Email.find({
            spaceId,
            direction: 'inbound'
        }).sort({ createdAt: -1 });

        if (emails.length === 0) {
            return {
                summary: "No proposals received yet.",
                rankings: [],
                recommendation: "Waiting for vendor responses."
            };
        }

        // 2. Prepare data for LLM
        const proposals: any[] = [];
        for (const email of emails) {
            const vendor = await vendorService.getVendorByEmail(email.from.email);
            proposals.push({
                vendorName: vendor?.name || email.from.name || 'Unknown Vendor',
                vendorCompany: vendor?.companyName || 'Unknown Company',
                content: email.bodyPlain || email.bodyHtml || 'No content',
                receivedAt: email.createdAt
            });
        }

        // 3. Generate comparison using LLM
        const prompt = `
      Compare the following vendor proposals for the RFP.
      
      Proposals:
      ${JSON.stringify(proposals)}
      
      Output a JSON object with:
      - summary: High-level summary of received proposals
      - rankings: Array of objects { vendorName, score (0-100), pros, cons, price (if mentioned) }
      - recommendation: Which vendor is recommended and why
      
      Focus on price, delivery time, and requirements match.
    `;

        try {
            const comparison = await llmService.generateJson(prompt);
            return comparison;
        } catch (error) {
            console.error('Failed to compare proposals:', error);
            throw error;
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
