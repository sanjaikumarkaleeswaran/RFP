/**
 * POST /emails/fix-vendor-ids - Fix inbound emails missing vendorId
 */
import { Request, Response, NextFunction } from 'express';
import { Email } from './model';
import mongoose from 'mongoose';
import { AppError } from '../../common/utils/AppError';

export const fixInboundVendorIds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        console.log('🔧 Starting to fix inbound email vendorIds...');

        // Find all inbound emails that are replies but don't have vendorId
        const inboundReplies = await Email.find({
            userId: new mongoose.Types.ObjectId(userId),
            direction: 'inbound',
            isReply: true,
            vendorId: { $exists: false }
        });

        console.log(`📧 Found ${inboundReplies.length} inbound replies without vendorId`);

        let fixed = 0;
        for (const reply of inboundReplies) {
            // Find the original outbound email
            const originalEmail = await Email.findOne({
                _id: reply.originalEmailId
            });

            if (originalEmail && originalEmail.vendorId) {
                // Update the reply with the vendorId from original
                await Email.updateOne(
                    { _id: reply._id },
                    { $set: { vendorId: originalEmail.vendorId } }
                );
                console.log(`✅ Fixed email ${reply._id} - added vendorId: ${originalEmail.vendorId}`);
                fixed++;
            }
        }

        console.log(`✅ Fixed ${fixed} out of ${inboundReplies.length} inbound replies`);

        res.json({
            success: true,
            message: `Fixed ${fixed} out of ${inboundReplies.length} inbound replies`,
            fixed,
            total: inboundReplies.length
        });
    } catch (error) {
        next(error);
    }
};
