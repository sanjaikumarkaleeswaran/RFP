import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        error = new AppError(message, 400);
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    }

    console.error('ERROR 💥', error);

    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
    });
};
