import mongoose, { Schema, Document } from 'mongoose';
import { IEmail } from '../email/model';

export interface IProposal extends Document {
    spaceId: mongoose.Types.ObjectId;
    vendorId?: mongoose.Types.ObjectId;
    sourceEmailId: mongoose.Types.ObjectId;
    rawText: string;
    extracted: {
        prices?: Array<{ item?: string; price: number; currency?: string }>;
        terms?: string;
        delivery?: string;
        validity?: string;
        completenessScore?: number;
        otherFields?: any;
    };
    attachments?: IEmail['attachments'];
    status: 'new' | 'parsed' | 'need_review' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const ProposalSchema: Schema = new Schema({
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    sourceEmailId: { type: Schema.Types.ObjectId, ref: 'Email', required: true },
    rawText: { type: String, required: true },
    extracted: {
        prices: [{
            item: String,
            price: Number,
            currency: String
        }],
        terms: String,
        delivery: String,
        validity: String,
        completenessScore: Number,
        otherFields: Schema.Types.Mixed
    },
    attachments: [{
        filename: String,
        mimeType: String,
        size: Number,
        storagePath: String
    }],
    status: {
        type: String,
        enum: ['new', 'parsed', 'need_review', 'accepted', 'rejected'],
        default: 'new'
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

export const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
