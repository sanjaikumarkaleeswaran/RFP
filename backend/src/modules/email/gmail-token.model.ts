import mongoose, { Schema, Document } from 'mongoose';

export interface IGmailToken extends Document {
    userId: mongoose.Types.ObjectId;
    accessToken: string;
    refreshToken: string;
    scope: string;
    tokenType: string;
    expiryDate: number;
    email?: string; // The Gmail account email
    isActive: boolean;
    watchHistoryId?: string; // For Gmail push notifications
    watchExpiration?: Date; // When the watch expires (7 days)
    createdAt: Date;
    updatedAt: Date;
}

const GmailTokenSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    scope: { type: String, required: true },
    tokenType: { type: String, default: 'Bearer' },
    expiryDate: { type: Number, required: true },
    email: { type: String },
    isActive: { type: Boolean, default: true },
    watchHistoryId: { type: String },
    watchExpiration: { type: Date }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc: any, ret: any) {
            const { _id, __v, accessToken, refreshToken, ...rest } = ret;
            return { id: _id.toString(), ...rest };
        }
    }
});

export const GmailToken = mongoose.model<IGmailToken>('GmailToken', GmailTokenSchema);
