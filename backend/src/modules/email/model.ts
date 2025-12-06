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
        attachmentId?: string;
        contentId?: string;
        inline?: boolean;
    }[];
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
    threadId?: string;
    gmailMessageId?: string;
    rawHeaders?: any;
    direction: 'inbound' | 'outbound';
    provider: 'gmail' | 'smtp' | 'manual';
    deliveryStatus?: 'pending' | 'sent' | 'failed' | 'bounced';
    deliveryError?: string;
    receivedAt?: Date;
    processed: boolean;
    isReply?: boolean;
    originalEmailId?: mongoose.Types.ObjectId;
    hasReply?: boolean;
    repliedAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    events?: {
        type: string;
        timestamp: Date;
        data?: any;
    }[];
    // Import-related fields
    isImported?: boolean;
    importedToSpaceId?: mongoose.Types.ObjectId;
    importedAt?: Date;
    vendorId?: mongoose.Types.ObjectId;
    isRead?: boolean;
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
        storagePath: String,
        attachmentId: String, // Gmail attachment ID
        contentId: String, // For inline images
        inline: { type: Boolean, default: false }
    }],
    messageId: { type: String, unique: true, sparse: true },
    inReplyTo: String,
    references: [String],
    threadId: { type: String, index: true },
    gmailMessageId: { type: String, index: true },
    rawHeaders: Schema.Types.Mixed,
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    provider: { type: String, enum: ['gmail', 'smtp', 'manual', 'resend'], default: 'manual' },
    deliveryStatus: { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'delayed', 'complained'], default: 'pending' },
    deliveryError: String,
    receivedAt: Date,
    processed: { type: Boolean, default: false },
    isReply: { type: Boolean, default: false },
    originalEmailId: { type: Schema.Types.ObjectId, ref: 'Email' },
    hasReply: { type: Boolean, default: false },
    repliedAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    events: [{
        type: String,
        timestamp: Date,
        data: Schema.Types.Mixed
    }],
    // Import-related fields
    isImported: { type: Boolean, default: false },
    importedToSpaceId: { type: Schema.Types.ObjectId, ref: 'Space' },
    importedAt: Date,
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc: any, ret: any) {
            const { _id, __v, ...rest } = ret;
            return { id: _id.toString(), ...rest };
        }
    }
});

export const Email = mongoose.model<IEmail>('Email', EmailSchema);
