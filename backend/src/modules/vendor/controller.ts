import { Request, Response, NextFunction } from 'express';
import { vendorService } from './service';
import { AppError } from '../../common/utils/AppError';

export const createVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendor = await vendorService.createVendor(req.body);
        res.status(201).json(vendor);
    } catch (error) {
        next(error);
    }
};

export const getVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendors = await vendorService.getVendors(req.query);
        res.status(200).json(vendors);
    } catch (error) {
        next(error);
    }
};

export const searchVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Accept categories as comma-separated query param or array
        let categories: string[] = [];

        if (req.query.categories) {
            const raw = req.query.categories;
            if (Array.isArray(raw)) {
                categories = raw.flatMap((r) => String(r).split(',').map(s => s.trim())).filter(Boolean);
            } else {
                categories = String(raw).split(',').map(s => s.trim()).filter(Boolean);
            }
        } else if (req.body && req.body.categories) {
            categories = Array.isArray(req.body.categories) ? req.body.categories : String(req.body.categories).split(',').map((s: string) => s.trim());
        }

        const vendors = await vendorService.searchByCategories(categories);
        res.status(200).json(vendors);
    } catch (error) {
        next(error);
    }
};

export const getVendorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendor = await vendorService.getVendorById(req.params.id);
        if (!vendor) {
            throw new AppError('Vendor not found', 404);
        }
        res.status(200).json(vendor);
    } catch (error) {
        next(error);
    }
};

export const updateVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendor = await vendorService.updateVendor(req.params.id, req.body);
        if (!vendor) {
            throw new AppError('Vendor not found', 404);
        }
        res.status(200).json(vendor);
    } catch (error) {
        next(error);
    }
};

export const deleteVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vendor = await vendorService.deleteVendor(req.params.id);
        if (!vendor) {
            throw new AppError('Vendor not found', 404);
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
