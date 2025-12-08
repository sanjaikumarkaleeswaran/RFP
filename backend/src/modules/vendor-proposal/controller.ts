import { Request, Response } from 'express';
import { vendorProposalService } from './service';

/**
 * Analyze a vendor reply email
 */
export const analyzeVendorReply = async (req: Request, res: Response) => {
    try {
        const { emailId } = req.body;

        if (!emailId) {
            return res.status(400).json({ error: 'Email ID is required' });
        }

        const proposal = await vendorProposalService.analyzeVendorReply(emailId);

        res.json({
            success: true,
            proposal
        });
    } catch (error) {
        console.error('Error analyzing vendor reply:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to analyze vendor reply'
        });
    }
};

/**
 * Get all proposals for a space
 */
export const getProposalsBySpace = async (req: Request, res: Response) => {
    try {
        const { spaceId } = req.params;

        const proposals = await vendorProposalService.getProposalsBySpace(spaceId);

        res.json({
            success: true,
            proposals
        });
    } catch (error) {
        console.error('Error getting proposals:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get proposals'
        });
    }
};

/**
 * Compare all proposals for a space
 */
export const compareProposals = async (req: Request, res: Response) => {
    try {
        const { spaceId } = req.params;

        const proposals = await vendorProposalService.compareProposals(spaceId);

        res.json({
            success: true,
            proposals
        });
    } catch (error) {
        console.error('Error comparing proposals:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to compare proposals'
        });
    }
};

/**
 * Accept a vendor proposal
 */
export const acceptProposal = async (req: Request, res: Response) => {
    try {
        const { proposalId } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const proposal = await vendorProposalService.acceptProposal(proposalId, userId);

        res.json({
            success: true,
            message: 'Proposal accepted successfully',
            proposal
        });
    } catch (error) {
        console.error('Error accepting proposal:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to accept proposal'
        });
    }
};

/**
 * Reject a vendor proposal
 */
export const rejectProposal = async (req: Request, res: Response) => {
    try {
        const { proposalId } = req.params;
        const { reason } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const proposal = await vendorProposalService.rejectProposal(
            proposalId,
            reason,
            userId
        );

        res.json({
            success: true,
            message: 'Proposal rejected successfully',
            proposal
        });
    } catch (error) {
        console.error('Error rejecting proposal:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to reject proposal'
        });
    }
};

/**
 * Get proposal by vendor and space
 */
export const getProposalByVendor = async (req: Request, res: Response) => {
    try {
        const { spaceId, vendorId } = req.params;

        const proposal = await vendorProposalService.getProposalByVendor(
            spaceId,
            vendorId
        );

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.json({
            success: true,
            proposal
        });
    } catch (error) {
        console.error('Error getting proposal:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get proposal'
        });
    }
};
