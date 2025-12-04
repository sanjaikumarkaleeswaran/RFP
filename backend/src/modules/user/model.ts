import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
    gmail?: {
        googleId: string;
        accessToken: string;
        refreshToken: string;
        scopes: string[];
        connectedAt: Date;
    };
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    gmail: {
        googleId: String,
        accessToken: String,
        refreshToken: String,
        scopes: [String],
        connectedAt: Date
    }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
