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


