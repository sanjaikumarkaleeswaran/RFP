import mongoose, { Schema, Document } from 'mongoose';

export interface ISpace extends Document {
    ownerId?: mongoose.Types.ObjectId;
    name: string;
    categories: string[];
    description?: string;
    requirements?: string;
    structuredData?: any;
    emailTemplate?: string;
    status: 'draft' | 'sent' | 'evaluating' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

const SpaceSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true },
    categories: { type: [String], default: [] },
    description: { type: String },
    requirements: { type: String },
    structuredData: { type: Schema.Types.Mixed },
    emailTemplate: { type: String },
    status: {
        type: String,
        enum: ['draft', 'sent', 'evaluating', 'closed'],
        default: 'draft'
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc: any, ret: any) {
            const { _id, __v, ...rest } = ret;
            return { id: _id.toString(), ...rest };
        }
    }
});

export const Space = mongoose.model<ISpace>('Space', SpaceSchema);
