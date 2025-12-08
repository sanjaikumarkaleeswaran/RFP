import { fetchWrapper } from '../shared/utils/fetchWrapper';

export interface VendorAnalysis {
    criteriaName: string;
    score: number;
    feedback: string;
    evidence?: string;
}

export interface AttachmentAnalysis {
    attachmentId: string;
    filename: string;
    mimeType: string;
    analysisType: 'pdf' | 'image' | 'other';
    extractedText?: string;
    extractedData?: any;
    insights?: string;
    analyzedAt: Date;
}

export interface VendorProposal {
    id: string;
    spaceId: string;
    vendorId: string;
    emailId: string;

    personalFeedback: string;
    overallScore: number;
    criteriaAnalysis: VendorAnalysis[];
    aiSummary: string;
    strengths: string[];
    weaknesses: string[];

    extractedData: {
        pricing?: {
            total?: number;
            currency?: string;
            breakdown?: Array<{ item: string; amount: number }>;
        };
        timeline?: {
            deliveryDate?: string;
            leadTime?: string;
        };
        terms?: {
            paymentTerms?: string;
            warranty?: string;
            validity?: string;
        };
        compliance?: {
            certifications?: string[];
            standards?: string[];
        };
        customFields?: any;
    };

    attachmentAnalyses: AttachmentAnalysis[];

    replyHistory: Array<{
        emailId: string;
        analyzedAt: Date;
        score: number;
    }>;

    status: 'pending' | 'analyzed' | 'accepted' | 'rejected';
    rejectionReason?: string;

    aiRecommendation?: {
        rank: number;
        isRecommended: boolean;
        reasoning: string;
        comparisonNotes?: string;
    };

    vendorId_populated?: any;
    emailId_populated?: any;

    createdAt: Date;
    updatedAt: Date;
}

export const vendorProposalService = {
    /**
     * Manually trigger analysis of a vendor reply
     */
    analyzeVendorReply: async (emailId: string): Promise<VendorProposal> => {
        const response = await fetchWrapper<{ proposal: VendorProposal }>(
            'POST',
            '/vendor-proposals/analyze',
            { emailId }
        );
        return response.proposal;
    },

    /**
     * Get all proposals for a space
     */
    getProposalsBySpace: async (spaceId: string): Promise<VendorProposal[]> => {
        const response = await fetchWrapper<{ proposals: VendorProposal[] }>(
            'GET',
            `/vendor-proposals/space/${spaceId}`
        );
        return response.proposals;
    },

    /**
     * Compare all proposals for a space and get AI recommendations
     */
    compareProposals: async (spaceId: string): Promise<VendorProposal[]> => {
        const response = await fetchWrapper<{ proposals: VendorProposal[] }>(
            'POST',
            `/vendor-proposals/space/${spaceId}/compare`
        );
        return response.proposals;
    },

    /**
     * Get proposal by vendor and space
     */
    getProposalByVendor: async (spaceId: string, vendorId: string): Promise<VendorProposal> => {
        const response = await fetchWrapper<{ proposal: VendorProposal }>(
            'GET',
            `/vendor-proposals/space/${spaceId}/vendor/${vendorId}`
        );
        return response.proposal;
    },

    /**
     * Accept a vendor proposal
     */
    acceptProposal: async (proposalId: string): Promise<VendorProposal> => {
        const response = await fetchWrapper<{ proposal: VendorProposal }>(
            'POST',
            `/vendor-proposals/${proposalId}/accept`
        );
        return response.proposal;
    },

    /**
     * Reject a vendor proposal
     */
    rejectProposal: async (proposalId: string, reason: string): Promise<VendorProposal> => {
        const response = await fetchWrapper<{ proposal: VendorProposal }>(
            'POST',
            `/vendor-proposals/${proposalId}/reject`,
            { reason }
        );
        return response.proposal;
    }
};
