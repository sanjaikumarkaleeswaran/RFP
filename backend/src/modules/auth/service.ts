import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../user/model';
import { AppError } from '../../common/utils/AppError';
import { LoginInput, RegisterInput, ChangePasswordInput } from './schema';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (id: string) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
};

export const verifyToken = (token: string): { id: string } => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Token has expired', 401);
        }
        throw new AppError('Invalid token', 401);
    }
};

export const register = async (input: RegisterInput) => {
    // Normalize email to lowercase
    const email = input.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new AppError('Email already in use', 409);
    }

    // Validate password strength
    if (input.password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create user
    const user = await User.create({
        email,
        passwordHash,
        name: input.name?.trim(),
    });

    // Generate token
    const token = signToken(user._id.toString());

    // Return user without passwordHash
    const userObject = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObject;

    return {
        user: {
            ...userWithoutPassword,
            id: user._id.toString()
        },
        token
    };
};

export const login = async (input: LoginInput) => {
    // Normalize email
    const email = input.email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = signToken(user._id.toString());

    // Return user without passwordHash
    const userObject = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObject;

    return {
        user: {
            ...userWithoutPassword,
            id: user._id.toString()
        },
        token
    };
};

export const getMe = async (userId: string) => {
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const userObject = user.toObject();
    return {
        ...userObject,
        id: user._id.toString()
    };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
    // Find user with password
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    if (input.newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters long', 400);
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (isSamePassword) {
        throw new AppError('New password must be different from current password', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.newPassword, salt);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    return { message: 'Password changed successfully' };
};

export const refreshToken = async (userId: string) => {
    // Verify user still exists
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Generate new token
    const token = signToken(user._id.toString());

    return { token };
};

/**
 * Generate password reset token and send email
 */
export const forgotPassword = async (email: string) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        // Don't reveal if email exists or not (security best practice)
        return {
            message: 'If an account with that email exists, a password reset link has been sent.'
        };
    }

    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the token before saving
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(resetToken, salt);

    // Save hashed token and expiry (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send email with reset token
    try {
        const { smtpEmailService } = await import('../../common/services/smtp-email.service');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${user.name || 'there'},</p>
                <p>You requested to reset your password for your Nova RFP account.</p>
                <p>Your password reset code is:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${resetToken}
                </div>
                <p>This code will expire in <strong>15 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated email from Nova RFP System. Please do not reply to this email.
                </p>
            </div>
        `;

        await smtpEmailService.sendEmail({
            to: user.email,
            subject: 'Password Reset Code - Nova RFP',
            html: emailHtml
        });

        console.log(`✅ Password reset email sent to: ${user.email}`);
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        // Clear the reset token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new AppError('Failed to send password reset email. Please try again later.', 500);
    }

    return {
        message: 'If an account with that email exists, a password reset link has been sent.'
    };
};

/**
 * Reset password using token
 */
export const resetPassword = async (email: string, token: string, newPassword: string) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with reset token
    const user = await User.findOne({
        email: normalizedEmail
    }).select('+resetPasswordToken +resetPasswordExpires +passwordHash');

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token is expired
    if (user.resetPasswordExpires < new Date()) {
        throw new AppError('Reset token has expired. Please request a new one.', 400);
    }

    // Verify token
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isTokenValid) {
        throw new AppError('Invalid reset token', 400);
    }

    // Validate new password
    if (newPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);

    return {
        message: 'Password has been reset successfully. You can now login with your new password.'
    };
};

