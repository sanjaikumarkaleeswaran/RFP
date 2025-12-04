import mongoose, { Schema, Document } from 'mongoose';

export interface IEmail extends Document {
    userId: mongoose.Types.ObjectId;
    spaceId?: mongoose.Types.ObjectId;
    from: { name?: string; email: string };
    to: { name?: string; email: string }[];
    cc?: { name?: string; email: string }[];
    subject?: string;
    bodyPlain?: string;
    bodyHtml?: string;
    attachments?: {
        filename: string;
        mimeType: string;
        size: number;
        storagePath: string;
    }[];
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
    threadId?: string;
    rawHeaders?: any;
    direction: 'inbound' | 'outbound';
    provider: 'gmail' | 'imap' | 'manual';
    receivedAt?: Date;
    processed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EmailSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space' },
    from: {
        name: String,
        email: { type: String, required: true }
    },
    to: [{
        name: String,
        email: { type: String, required: true }
    }],
    cc: [{
        name: String,
        email: String
    }],
    subject: String,
    bodyPlain: String,
    bodyHtml: String,
    attachments: [{
        filename: String,
        mimeType: String,
        size: Number,
        storagePath: String
    }],
    messageId: { type: String, unique: true, sparse: true },
    inReplyTo: String,
    references: [String],
    threadId: { type: String, index: true },
    rawHeaders: Schema.Types.Mixed,
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    provider: { type: String, enum: ['gmail', 'imap', 'manual'], default: 'manual' },
    receivedAt: Date,
    processed: { type: Boolean, default: false }
}, { timestamps: true });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);
