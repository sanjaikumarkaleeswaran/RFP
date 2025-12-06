import { Proposal, IProposal } from './model';
import { llmService } from '../../common/services/llm.service';

export class ProposalService {
    async createProposal(data: Partial<IProposal>): Promise<IProposal> {
        const proposal = new Proposal(data);
        return await proposal.save();
    }

    async getProposals(filter: any = {}): Promise<IProposal[]> {
        return await Proposal.find(filter).sort({ createdAt: -1 });
    }

    async getProposalById(id: string): Promise<IProposal | null> {
        return await Proposal.findById(id);
    }

    async updateProposal(id: string, data: Partial<IProposal>): Promise<IProposal | null> {
        return await Proposal.findByIdAndUpdate(id, data, { new: true });
    }

    /**
     * Parse proposal from raw text using LLM
     */
    async parseProposal(proposalId: string): Promise<IProposal | null> {
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return null;

        const prompt = `
      Extract the following fields from the vendor proposal text below into a JSON object:
      - prices: array of objects with { item, price (number), currency }
      - terms: string (payment terms)
      - delivery: string (delivery timeline)
      - validity: string (quote validity)
      - completenessScore: number (0-100 based on presence of price, terms, delivery)

      Proposal Text:
      "${proposal.rawText}"
    `;

        try {
            const extractedData = await llmService.generateJson<any>(prompt);

            proposal.extracted = extractedData;
            proposal.status = 'parsed';
            await proposal.save();
            return proposal;
        } catch (error) {
            console.error('Failed to parse proposal:', error);
            throw error;
        }
    }
}

export const proposalService = new ProposalService();
