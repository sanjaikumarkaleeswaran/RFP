import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { User } from '../../modules/user/model';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

interface JwtPayload {
    id: string;
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

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const user = await User.findById(decoded.id).select('email');

        if (!user) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
        };
        next();
    } catch (error) {
        return next(new AppError('Not authorized to access this route', 401));
    }
};

