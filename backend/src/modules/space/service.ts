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
      - otherRequirements: string or null

      Requirement Text:
      "${rawRequirements}"
    `;

        try {
            const structuredData = await llmService.generateJson(prompt);

            // 3. Save structured data
            space.structuredData = structuredData;
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
}

export const spaceService = new SpaceService();
