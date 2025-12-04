import { Request, Response, NextFunction } from 'express';
import { proposalService } from './service';
import { AppError } from '../../common/utils/AppError';

export const createProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const proposal = await proposalService.createProposal(req.body);
        res.status(201).json(proposal);
    } catch (error) {
        next(error);
    }
};

export const getProposals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const proposals = await proposalService.getProposals(req.query);
        res.status(200).json(proposals);
    } catch (error) {
        next(error);
    }
};

export const getProposalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const proposal = await proposalService.getProposalById(req.params.id);
        if (!proposal) {
            throw new AppError('Proposal not found', 404);
        }
        res.status(200).json(proposal);
    } catch (error) {
        next(error);
    }
};

export const parseProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const proposal = await proposalService.parseProposal(req.params.id);
        if (!proposal) {
            throw new AppError('Proposal not found', 404);
        }
        res.status(200).json(proposal);
    } catch (error) {
        next(error);
    }
};
