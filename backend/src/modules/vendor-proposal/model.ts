import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorAnalysis {
    criteriaName: string;
    score: number; // 0-10
    feedback: string;
    evidence?: string;
}

export interface IAttachmentAnalysis {
    attachmentId: string;
    filename: string;
    mimeType: string;
    analysisType: 'pdf' | 'image' | 'other';
    extractedText?: string;
    extractedData?: any;
    insights?: string;
    analyzedAt: Date;
}

export interface IVendorProposal extends Document {
    spaceId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    emailId: mongoose.Types.ObjectId; // Latest reply email

    // Analysis results
    personalFeedback: string; // Personal feedback for this vendor
    overallScore: number; // 0-100
    criteriaAnalysis: IVendorAnalysis[];
    aiSummary: string;
    strengths: string[];
    weaknesses: string[];

    // Structured data extracted from reply
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

    // Attachment analysis
    attachmentAnalyses: IAttachmentAnalysis[];

    // Reply history
    replyHistory: Array<{
        emailId: mongoose.Types.ObjectId;
        analyzedAt: Date;
        score: number;
    }>;

    // Status
    status: 'pending' | 'analyzed' | 'accepted' | 'rejected';
    rejectionReason?: string;

    // AI Recommendation
    aiRecommendation?: {
        rank: number;
        isRecommended: boolean;
        reasoning: string;
        comparisonNotes?: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

const VendorProposalSchema: Schema = new Schema({
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    emailId: { type: Schema.Types.ObjectId, ref: 'Email', required: true },

    personalFeedback: { type: String, default: '' },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    criteriaAnalysis: [{
        criteriaName: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 10 },
        feedback: { type: String, required: true },
        evidence: String
    }],
    aiSummary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],

    extractedData: {
        pricing: {
            total: Number,
            currency: String,
            breakdown: [{
                item: String,
                amount: Number
            }]
        },
        timeline: {
            deliveryDate: String,
            leadTime: String
        },
        terms: {
            paymentTerms: String,
            warranty: String,
            validity: String
        },
        compliance: {
            certifications: [String],
            standards: [String]
        },
        customFields: Schema.Types.Mixed
    },

    attachmentAnalyses: [{
        attachmentId: { type: String, required: true },
        filename: { type: String, required: true },
        mimeType: { type: String, required: true },
        analysisType: { type: String, enum: ['pdf', 'image', 'other'], required: true },
        extractedText: String,
        extractedData: Schema.Types.Mixed,
        insights: String,
        analyzedAt: { type: Date, default: Date.now }
    }],

    replyHistory: [{
        emailId: { type: Schema.Types.ObjectId, ref: 'Email', required: true },
        analyzedAt: { type: Date, default: Date.now },
        score: { type: Number, required: true }
    }],

    status: {
        type: String,
        enum: ['pending', 'analyzed', 'accepted', 'rejected'],
        default: 'pending'
    },
    rejectionReason: String,

    aiRecommendation: {
        rank: Number,
        isRecommended: Boolean,
        reasoning: String,
        comparisonNotes: String
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc: any, ret: any) {
            const { _id, __v, ...rest } = ret;
            return { id: _id.toString(), ...rest };
        }
    }
});

// Indexes for efficient queries
VendorProposalSchema.index({ spaceId: 1, vendorId: 1 }, { unique: true });
VendorProposalSchema.index({ spaceId: 1, status: 1 });
VendorProposalSchema.index({ vendorId: 1 });

export const VendorProposal = mongoose.model<IVendorProposal>('VendorProposal', VendorProposalSchema);
