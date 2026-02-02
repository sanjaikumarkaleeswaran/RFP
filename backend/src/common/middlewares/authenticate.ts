import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { User } from '../../modules/user/model';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

interface JwtPayload {
    id: string;
    iat?: number;
    exp?: number;
}

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                [key: string]: any;
            };
        }
    }
}

/**
 * Extract token from request headers or cookies
 */
const extractToken = (req: Request): string | null => {
    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }

    // Check cookies (if cookie-parser is used)
    if (req.cookies?.token) {
        return req.cookies.token;
    }

    return null;
};

/**
 * Middleware to authenticate user via JWT
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract token
        const token = extractToken(req);

        if (!token) {
            return next(new AppError('Not authorized. Please log in to access this route.', 401));
        }

        // Verify token
        let decoded: JwtPayload;
        try {
            console.log('🔐 Verifying token for route:', req.path);
            console.log('🔑 Token preview:', token.substring(0, 30) + '...');
            decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            console.log('✅ Token verified successfully, user ID:', decoded.id);
        } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            if (error instanceof jwt.TokenExpiredError) {
                return next(new AppError('Your session has expired. Please log in again.', 401));
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return next(new AppError('Invalid token. Please log in again.', 401));
            }
            throw error;
        }

        // Check if user still exists
        const user = await User.findById(decoded.id).select('-passwordHash');

        console.log({ user })

        if (!user) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        // Attach user to request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
        };

        next();
    } catch (error) {
        return next(new AppError('Authentication failed. Please try again.', 401));
    }
};

/**
 * Optional authentication - doesn't fail if no token is provided
 * Useful for routes that work differently for authenticated vs non-authenticated users
 */
export const optionalAuthenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const user = await User.findById(decoded.id).select('-passwordHash');

        if (user) {
            req.user = {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            };
        }

        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
};


