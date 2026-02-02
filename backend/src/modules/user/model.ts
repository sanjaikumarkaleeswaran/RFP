import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    gmail?: {
        googleId: string;
        accessToken: string;
        refreshToken: string;
        scopes: string[];
        connectedAt: Date;
    };
}

const UserSchema: Schema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        select: false, // Don't include password in queries by default
    },
    name: {
        type: String,
        trim: true,
    },
    resetPasswordToken: {
        type: String,
        select: false, // Don't include in queries by default
    },
    resetPasswordExpires: {
        type: Date,
        select: false, // Don't include in queries by default
    },
    gmail: {
        googleId: String,
        accessToken: String,
        refreshToken: String,
        scopes: [String],
        connectedAt: Date
    }
}, {
    timestamps: true,
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'gmail.googleId': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

