import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/prisma';
import { AppError } from '../../common/utils/AppError';
import { LoginInput, RegisterInput } from './auth.schema';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const signToken = (id: string) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

export const register = async (input: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new AppError('Email already in use', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
        },
    });

    const token = signToken(user.id);

    return { user, token };
};

export const login = async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(user.id);

    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};
