import { Request, Response } from 'express';
import { vendorProposalService } from './service';
import { Email } from '../email/model';

/**
 * Manually analyze an existing email reply
 * Use this when a vendor reply exists but wasn't auto-analyzed
 */
export const manuallyAnalyzeReply = async (req: Request, res: Response) => {
    try {
        const { emailId } = req.body;

        if (!emailId) {
            return res.status(400).json({
                error: 'Email ID is required',
                message: 'Provide the emailId of the vendor reply to analyze'
            });
        }

        console.log('🔧 Manual analysis requested for email:', emailId);

        // Check if email exists
        const email = await Email.findById(emailId);
        if (!email) {
            return res.status(404).json({
                error: 'Email not found',
                message: `No email found with ID: ${emailId}`
            });
        }

        console.log('📧 Email found:', {
            from: email.from,
            subject: email.subject,
            vendorId: email.vendorId,
            spaceId: email.spaceId
        });

        // Analyze the reply
        const proposal = await vendorProposalService.analyzeVendorReply(emailId);

        res.json({
            success: true,
            message: 'Email analyzed successfully',
            proposal
        });

    } catch (error) {
        console.error('Error in manual analysis:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to analyze email'
        });
    }
};

/**
 * Find all vendor replies that haven't been analyzed yet
 */
export const findUnanalyzedReplies = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find all inbound emails from vendors
        const unanalyzedEmails = await Email.find({
            userId,
            direction: 'inbound',
            isReply: true,
            vendorId: { $exists: true, $ne: null },
            spaceId: { $exists: true, $ne: null }
        })
            .populate('vendorId')
            .populate('spaceId')
            .sort({ receivedAt: -1 });

        console.log(`📊 Found ${unanalyzedEmails.length} vendor replies`);

        res.json({
            success: true,
            count: unanalyzedEmails.length,
            emails: unanalyzedEmails.map(email => ({
                id: email._id,
                from: email.from,
                subject: email.subject,
                vendor: (email.vendorId as any)?.name,
                space: (email.spaceId as any)?.name,
                receivedAt: email.receivedAt,
                hasAttachments: email.attachments && email.attachments.length > 0
            }))
        });

    } catch (error) {
        console.error('Error finding unanalyzed replies:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to find unanalyzed replies'
        });
    }
};

/**
 * Batch analyze all unanalyzed vendor replies
 */
export const batchAnalyzeReplies = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find all unanalyzed vendor replies
        const unanalyzedEmails = await Email.find({
            userId,
            direction: 'inbound',
            isReply: true,
            vendorId: { $exists: true, $ne: null },
            spaceId: { $exists: true, $ne: null }
        });

        console.log(`🔄 Batch analyzing ${unanalyzedEmails.length} vendor replies...`);

        const results = [];
        const errors = [];

        for (const email of unanalyzedEmails) {
            try {
                console.log(`   Analyzing: ${email.subject}`);
                const proposal = await vendorProposalService.analyzeVendorReply(email._id.toString());
                results.push({
                    emailId: email._id,
                    subject: email.subject,
                    success: true,
                    proposalId: proposal.id
                });
            } catch (error) {
                console.error(`   Failed to analyze ${email._id}:`, error);
                errors.push({
                    emailId: email._id,
                    subject: email.subject,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        console.log(`✅ Batch analysis complete: ${results.length} success, ${errors.length} errors`);

        res.json({
            success: true,
            message: `Analyzed ${results.length} vendor replies`,
            analyzed: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error) {
        console.error('Error in batch analysis:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to batch analyze'
        });
    }
};
