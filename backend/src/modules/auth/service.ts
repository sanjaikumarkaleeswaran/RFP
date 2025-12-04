import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../user/model';
import { AppError } from '../../common/utils/AppError';
import { LoginInput, RegisterInput } from './schema';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const signToken = (id: string) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
};

export const register = async (input: RegisterInput) => {
    const existingUser = await User.findOne({ email: input.email });

    if (existingUser) {
        throw new AppError('Email already in use', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
        email: input.email,
        passwordHash,
        name: input.name,
    });

    const token = signToken(user._id.toString());

    // Return user without passwordHash
    const userObject = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObject;

    return { user: userWithoutPassword, token };
};

export const login = async (input: LoginInput) => {
    const user = await User.findOne({ email: input.email });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(user._id.toString());

    const userObject = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObject;

    return { user: userWithoutPassword, token };
};

export const getMe = async (userId: string) => {
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};

