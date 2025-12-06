import { Email, IEmail } from '../../modules/email/model';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';

interface EmailThread {
    originalEmail: IEmail;
    replies: IEmail[];
    totalReplies: number;
}

class EmailThreadService {
    /**
     * Get complete email thread (original + all replies)
     */
    async getEmailThread(emailId: string, userId: mongoose.Types.ObjectId): Promise<EmailThread> {
        // Find the original email
        const email = await Email.findById(emailId);

        if (!email) {
            throw new AppError('Email not found', 404);
        }

        // Verify ownership
        if (email.userId.toString() !== userId.toString()) {
            throw new AppError('Unauthorized access to email', 403);
        }

        // Determine if this is the original email or a reply
        let originalEmail: IEmail;
        if (email.isReply && email.originalEmailId) {
            // This is a reply, fetch the original
            const original = await Email.findById(email.originalEmailId);
            if (!original) {
                throw new AppError('Original email not found', 404);
            }
            originalEmail = original;
        } else {
            // This is the original email
            originalEmail = email;
        }

        // Fetch all replies to the original email
        const replies = await Email.find({
            originalEmailId: originalEmail._id,
            isReply: true,
            direction: 'inbound'
        }).sort({ receivedAt: 1 }); // Chronological order

        return {
            originalEmail,
            replies,
            totalReplies: replies.length
        };
    }

    /**
     * Get all threads for a user (grouped by original email)
     */
    async getUserThreads(
        userId: mongoose.Types.ObjectId,
        spaceId?: mongoose.Types.ObjectId,
        limit: number = 50
    ): Promise<any[]> {
        const filter: any = {
            userId,
            direction: 'outbound',
            isReply: false // Only original emails
        };

        if (spaceId) {
            filter.spaceId = spaceId;
        }

        // Get original emails
        const originalEmails = await Email.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit);

        // For each original email, get reply count and latest reply
        const threads = await Promise.all(
            originalEmails.map(async (email) => {
                const replies = await Email.find({
                    originalEmailId: email._id,
                    isReply: true,
                    direction: 'inbound'
                }).sort({ receivedAt: -1 });

                const latestReply = replies[0] || null;

                return {
                    id: email._id,
                    subject: email.subject,
                    from: email.from,
                    to: email.to,
                    sentAt: email.createdAt,
                    messageId: email.messageId,
                    spaceId: email.spaceId,
                    hasReply: email.hasReply || false,
                    replyCount: replies.length,
                    latestReply: latestReply ? {
                        id: latestReply._id,
                        from: latestReply.from,
                        receivedAt: latestReply.receivedAt,
                        bodyPlain: latestReply.bodyPlain?.substring(0, 200) + '...'
                    } : null,
                    deliveryStatus: email.deliveryStatus
                };
            })
        );

        return threads;
    }

    /**
     * Mark email as having a reply
     */
    async markAsReplied(originalEmailId: mongoose.Types.ObjectId): Promise<void> {
        await Email.findByIdAndUpdate(originalEmailId, {
            hasReply: true,
            repliedAt: new Date()
        });
    }

    /**
     * Link reply to original email
     */
    async linkReplyToOriginal(
        replyEmail: IEmail,
        originalMessageId: string
    ): Promise<boolean> {
        // Find original email by messageId
        const originalEmail = await Email.findOne({
            messageId: originalMessageId,
            direction: 'outbound'
        });

        if (!originalEmail) {
            console.log(`Original email not found for messageId: ${originalMessageId}`);
            return false;
        }

        // Update reply email
        await Email.findByIdAndUpdate(replyEmail._id, {
            originalEmailId: originalEmail._id,
            isReply: true,
            spaceId: originalEmail.spaceId, // Inherit spaceId from original
            userId: originalEmail.userId // Inherit userId from original
        });

        // Mark original as replied
        await this.markAsReplied(originalEmail._id);

        console.log(`✅ Linked reply ${replyEmail._id} to original ${originalEmail._id}`);
        return true;
    }

    /**
     * Find original email from reply headers
     */
    async findOriginalFromHeaders(
        inReplyTo?: string,
        references?: string[]
    ): Promise<IEmail | null> {
        if (!inReplyTo && (!references || references.length === 0)) {
            return null;
        }

        // Try to find by In-Reply-To header first
        if (inReplyTo) {
            const original = await Email.findOne({
                messageId: inReplyTo,
                direction: 'outbound'
            });
            if (original) return original;
        }

        // Try to find by References header
        if (references && references.length > 0) {
            // Check each reference in reverse order (most recent first)
            for (let i = references.length - 1; i >= 0; i--) {
                const original = await Email.findOne({
                    messageId: references[i],
                    direction: 'outbound'
                });
                if (original) return original;
            }
        }

        return null;
    }

    /**
     * Get thread statistics for a space
     */
    async getThreadStats(
        userId: mongoose.Types.ObjectId,
        spaceId?: mongoose.Types.ObjectId
    ): Promise<{
        totalSent: number;
        totalReplies: number;
        replyRate: number;
        avgResponseTime: number;
    }> {
        const filter: any = { userId };
        if (spaceId) filter.spaceId = spaceId;

        const totalSent = await Email.countDocuments({
            ...filter,
            direction: 'outbound',
            isReply: false
        });

        const totalReplies = await Email.countDocuments({
            ...filter,
            direction: 'inbound',
            isReply: true
        });

        const replyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;

        // Calculate average response time
        const repliedEmails = await Email.find({
            ...filter,
            direction: 'outbound',
            hasReply: true,
            repliedAt: { $exists: true }
        }).select('createdAt repliedAt');

        let avgResponseTime = 0;
        if (repliedEmails.length > 0) {
            const totalResponseTime = repliedEmails.reduce((sum, email) => {
                const responseTime = email.repliedAt!.getTime() - email.createdAt.getTime();
                return sum + responseTime;
            }, 0);
            avgResponseTime = totalResponseTime / repliedEmails.length / (1000 * 60 * 60); // Convert to hours
        }

        return {
            totalSent,
            totalReplies,
            replyRate: Math.round(replyRate * 100) / 100,
            avgResponseTime: Math.round(avgResponseTime * 100) / 100
        };
    }
}

export const emailThreadService = new EmailThreadService();
