import { Request, Response, NextFunction } from 'express';
import { spaceService } from './service';
import { AppError } from '../../common/utils/AppError';
import { vendorService } from '../vendor/service';

export const createSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // TODO: Attach ownerId from authenticated user
        // req.body.ownerId = req.user._id; 
        const space = await spaceService.createSpace(req.body);
        res.status(201).json(space);
    } catch (error) {
        next(error);
    }
};

export const getSpaces = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // TODO: Filter by ownerId
        const spaces = await spaceService.getSpaces(req.query);
        res.status(200).json(spaces);
    } catch (error) {
        next(error);
    }
};

export const getSpaceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const space = await spaceService.getSpaceById(req.params.id);
        if (!space) {
            throw new AppError('Space not found', 404);
        }
        res.status(200).json(space);
    } catch (error) {
        next(error);
    }
};

export const updateSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const space = await spaceService.updateSpace(req.params.id, req.body);
        if (!space) {
            throw new AppError('Space not found', 404);
        }
        res.status(200).json(space);
    } catch (error) {
        next(error);
    }
};

export const deleteSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const space = await spaceService.deleteSpace(req.params.id);
        if (!space) {
            throw new AppError('Space not found', 404);
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const parseRequirements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rawRequirements } = req.body;
        const space = await spaceService.parseRequirements(req.params.id, rawRequirements);
        if (!space) {
            throw new AppError('Space not found', 404);
        }
        res.status(200).json(space);
    } catch (error) {
        next(error);
    }
};

export const generateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const space = await spaceService.generateTemplate(req.params.id);
        if (!space) {
            throw new AppError('Space not found', 404);
        }
        res.status(200).json(space);
    } catch (error) {
        next(error);
    }
};

/**
 * Return vendors that match the categories for a given space.
 * Endpoint: GET /api/spaces/:id/vendors
 */
export const getVendorsForSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const space = await spaceService.getSpaceById(req.params.id);
        if (!space) {
            throw new AppError('Space not found', 404);
        }

        const categories = Array.isArray(space.categories) ? space.categories : [];
        if (categories.length === 0) {
            return res.status(200).json([]);
        }

        const vendors = await vendorService.searchByCategories(categories.map(String));
        res.status(200).json(vendors);
    } catch (error) {
        next(error);
    }
};

/**
 * Send RFP email to selected vendors
 * Endpoint: POST /api/spaces/:id/send-rfp
 */
export const sendRFPToVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { vendorIds, emailContent } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
            throw new AppError('Vendor IDs are required', 400);
        }

        if (!emailContent || typeof emailContent !== 'string') {
            throw new AppError('Email content is required', 400);
        }

        // Convert uploaded files to attachment format
        const attachments = files?.map(file => ({
            filename: file.originalname,
            content: file.buffer,
            mimeType: file.mimetype
        })) || [];

        const result = await spaceService.sendRFPToVendors(
            req.params.id,
            vendorIds,
            emailContent,
            (req as any).user.id,
            attachments
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


/**
 * Compare all proposals for a space
 * Endpoint: GET /api/spaces/:id/proposals/compare
 */
export const compareProposals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await spaceService.compareProposals(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Import manual email and create proposal
 * Endpoint: POST /api/spaces/:id/import-email
 */
export const importManualEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { from, subject, content, vendorId } = req.body;

        if (!from || !from.email || !content) {
            throw new AppError('From email and content are required', 400);
        }

        const result = await spaceService.importManualEmail(req.params.id, {
            from,
            subject,
            content,
            vendorId
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get email statuses for vendors in a space
 * Endpoint: GET /api/spaces/:id/email-statuses
 */
export const getVendorEmailStatuses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statuses = await spaceService.getVendorEmailStatuses(req.params.id);
        res.status(200).json(statuses);
    } catch (error) {
        next(error);
    }
};
