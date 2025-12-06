import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error for debugging
    console.error('Error:', err);

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        return res.status(400).json({
            status: 'fail',
            message: 'Validation error',
            errors,
        });
    }

    // Handle custom AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            status: 'fail',
            message: `${field} already exists`,
        });
    }

    // Handle MongoDB CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid ID format',
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Token expired',
        });
    }

    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message,
        }));

        return res.status(400).json({
            status: 'fail',
            message: 'Validation error',
            errors,
        });
    }

    // Default error response
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
