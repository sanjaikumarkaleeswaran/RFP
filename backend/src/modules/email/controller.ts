import { Request, Response, NextFunction } from 'express';
import { emailService } from './service';
import { AppError } from '../../common/utils/AppError';

export const importEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // TODO: Handle file uploads for attachments if needed
        // req.body.userId = req.user._id;
        const email = await emailService.createEmail(req.body);
        res.status(201).json(email);
    } catch (error) {
        next(error);
    }
};

export const getEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const emails = await emailService.getEmails(req.query);
        res.status(200).json(emails);
    } catch (error) {
        next(error);
    }
};

export const getEmailById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = await emailService.getEmailById(req.params.id);
        if (!email) {
            throw new AppError('Email not found', 404);
        }
        res.status(200).json(email);
    } catch (error) {
        next(error);
    }
};

export const attachToSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { spaceId } = req.body;
        const email = await emailService.attachToSpace(req.params.id, spaceId);
        if (!email) {
            throw new AppError('Email not found', 404);
        }
        res.status(200).json(email);
    } catch (error) {
        next(error);
    }
};
