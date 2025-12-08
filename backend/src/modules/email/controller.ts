import { Request, Response, NextFunction } from 'express';
import { emailService } from './service';
import { AppError } from '../../common/utils/AppError';
import { smtpEmailService } from '../../common/services/smtp-email.service';
import { gmailAPIService } from '../../common/services/gmail-api.service';
import { emailThreadService } from '../../common/services/email-thread.service';
import { Email } from './model';
import mongoose from 'mongoose';

// ==================== ORIGINAL EMAIL ENDPOINTS ====================

export const importEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

// ==================== SMTP EMAIL ENDPOINTS ====================

/**
 * POST /email/send - Send single email via SMTP
 */
export const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { to, subject, text, html, attachments } = req.body;
        const userId = (req as any).user?.id;

        if (!to || !subject) {
            throw new AppError('Missing required fields: to, subject', 400);
        }

        const result = await smtpEmailService.sendEmail({
            to,
            subject,
            text,
            html,
            attachments,
            userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /email/bulk - Send bulk emails via SMTP
 */
export const sendBulkEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { recipients, subject, text, html, attachments } = req.body;
        const userId = (req as any).user?.id;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            throw new AppError('Recipients must be a non-empty array', 400);
        }

        if (!subject) {
            throw new AppError('Subject is required', 400);
        }

        const results = await smtpEmailService.sendBulkEmails(
            recipients,
            subject,
            text,
            html,
            attachments,
            userId ? new mongoose.Types.ObjectId(userId) : undefined
        );

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            total: results.length,
            sent: successCount,
            failed: failedCount,
            results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /smtp/verify - Verify SMTP connection
 */
export const verifySMTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await smtpEmailService.verifyConnection();
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// ==================== GMAIL API ENDPOINTS ====================

/**
 * GET /gmail/auth-url - Get Gmail OAuth URL
 */
export const getGmailAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        console.log(userId);

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const authUrl = gmailAPIService.getAuthUrl(userId);

        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /gmail/oauth/callback - Handle OAuth callback
 */
export const handleGmailCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            throw new AppError('Missing code or state parameter', 400);
        }

        const userId = new mongoose.Types.ObjectId(state as string);
        await gmailAPIService.getTokensFromCode(code as string, userId);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/gmail-connected?success=true`);
    } catch (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/gmail-connected?success=false&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
    }
};

/**
 * POST /gmail/check-replies - Check for new Gmail replies
 */
export const checkGmailReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const replies = await gmailAPIService.checkReplies(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            count: replies.length,
            replies
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/send - Send email via Gmail API
 */
export const sendViaGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { to, subject, text, html, spaceId, vendorId, inReplyTo, threadId } = req.body;
        const userId = (req as any).user?.id;
        console.log({ user: req.user })

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!to || !subject) {
            throw new AppError('Missing required fields: to, subject', 400);
        }

        const result = await gmailAPIService.sendEmail(
            new mongoose.Types.ObjectId(userId),
            to,
            subject,
            text,
            html,
            spaceId ? new mongoose.Types.ObjectId(spaceId) : undefined,
            inReplyTo,
            threadId,
            vendorId ? new mongoose.Types.ObjectId(vendorId) : undefined
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /gmail/status - Check Gmail connection status
 */
export const getGmailStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const accountInfo = await gmailAPIService.getAccountInfo(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            ...accountInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/disconnect - Disconnect Gmail
 */
export const disconnectGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        await gmailAPIService.disconnect(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            message: 'Gmail disconnected successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ==================== GMAIL WATCH ENDPOINTS ====================

/**
 * POST /gmail/watch/start - Start watching for replies
 */
export const startGmailWatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWatchService } = await import('../../common/services/gmail-watch.service');
        const intervalSeconds = req.body.intervalSeconds || 30;

        await gmailWatchService.startWatching(
            new mongoose.Types.ObjectId(userId),
            intervalSeconds
        );

        res.json({
            success: true,
            message: `Gmail watch started. Checking every ${intervalSeconds} seconds.`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/watch/stop - Stop watching for replies
 */
export const stopGmailWatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWatchService } = await import('../../common/services/gmail-watch.service');

        gmailWatchService.stopWatching(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            message: 'Gmail watch stopped'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/watch/check - Manually check for replies now
 */
export const checkGmailRepliesNow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWatchService } = await import('../../common/services/gmail-watch.service');

        const replies = await gmailWatchService.checkForReplies(
            new mongoose.Types.ObjectId(userId)
        );

        res.json({
            success: true,
            count: replies.length,
            replies
        });
    } catch (error) {
        next(error);
    }
};

// ==================== GMAIL WEBHOOK ENDPOINTS (Push Notifications) ====================

/**
 * POST /gmail/webhook/start - Start Gmail push notifications
 */
export const startGmailWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWebhookService } = await import('../../common/services/gmail-webhook.service');

        const watchData = await gmailWebhookService.startWatch(
            new mongoose.Types.ObjectId(userId)
        );

        if (!watchData) {
            throw new AppError('Failed to start Gmail webhook. Please check your Gmail connection.', 500);
        }

        res.json({
            success: true,
            message: 'Gmail webhook started successfully',
            data: {
                historyId: watchData.historyId,
                expiration: new Date(parseInt(watchData.expiration)).toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/webhook/stop - Stop Gmail push notifications
 */
export const stopGmailWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWebhookService } = await import('../../common/services/gmail-webhook.service');

        await gmailWebhookService.stopWatch(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            message: 'Gmail webhook stopped successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/webhook/renew - Renew Gmail watch (watches expire after 7 days)
 */
export const renewGmailWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const { gmailWebhookService } = await import('../../common/services/gmail-webhook.service');

        await gmailWebhookService.renewWatch(new mongoose.Types.ObjectId(userId));

        res.json({
            success: true,
            message: 'Gmail webhook renewed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /gmail/webhook/notifications - Receive push notifications from Gmail
 * This endpoint is called by Google Cloud Pub/Sub
 */
export const handleGmailWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('📬 Received Gmail webhook notification');
        console.log('Headers:', req.headers);
        console.log('Body:', JSON.stringify(req.body, null, 2));

        // Pub/Sub sends data in this format:
        // { message: { data: base64EncodedString, messageId: string, publishTime: string } }
        const { message } = req.body;

        if (!message || !message.data) {
            console.warn('⚠️  Invalid webhook payload - missing message.data');
            // Still return 200 to acknowledge receipt
            return res.status(200).send('OK');
        }

        // Decode the base64 data
        const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
        const notification = JSON.parse(decodedData);

        console.log('📧 Decoded notification:', notification);
        console.log("Decoded Data", decodedData);

        // Process the notification
        const { gmailWebhookService } = await import('../../common/services/gmail-webhook.service');
        await gmailWebhookService.handleNotification(notification);

        // Always return 200 to acknowledge receipt
        res.status(200).send('OK');
    } catch (error: any) {
        console.error('❌ Error handling Gmail webhook:', error);
        // Still return 200 to prevent Pub/Sub from retrying
        res.status(200).send('OK');
    }
};

// ==================== EMAIL MANAGEMENT ENDPOINTS ====================


/**
 * GET /emails/replies - Get all replies from database
 */
export const getReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId } = req.query;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const filter: any = {
            userId: new mongoose.Types.ObjectId(userId),
            direction: 'inbound',
            isReply: true
        };

        if (spaceId) {
            filter.spaceId = new mongoose.Types.ObjectId(spaceId as string);
        }

        const replies = await Email.find(filter)
            .populate('originalEmailId')
            .sort({ receivedAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: replies.length,
            replies
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/sent - Get all sent emails
 */
export const getSentEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId } = req.query;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const filter: any = {
            userId: new mongoose.Types.ObjectId(userId),
            direction: 'outbound'
        };

        if (spaceId) {
            filter.spaceId = new mongoose.Types.ObjectId(spaceId as string);
        }

        const emails = await Email.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: emails.length,
            emails
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/vendor/:vendorId - Get all emails for a specific vendor
 */
export const getVendorEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { vendorId } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Get vendor to find their email addresses
        const { vendorService } = await import('../vendor/service');
        const vendor = await vendorService.getVendorById(vendorId);

        if (!vendor) {
            throw new AppError('Vendor not found', 404);
        }

        const vendorEmails = vendor.emails || [];

        // Find all emails (sent and received) involving this vendor
        const emails = await Email.find({
            userId: new mongoose.Types.ObjectId(userId),
            $or: [
                { 'from.email': { $in: vendorEmails } }, // Emails FROM vendor
                { 'to.email': { $in: vendorEmails } }     // Emails TO vendor
            ]
        })
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({
            success: true,
            count: emails.length,
            data: emails
        });
    } catch (error) {
        next(error);
    }
};


// ==================== EMAIL THREADING ENDPOINTS ====================

/**
 * GET /emails/:id/thread - Get complete email thread
 */
export const getEmailThread = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const thread = await emailThreadService.getEmailThread(
            req.params.id,
            new mongoose.Types.ObjectId(userId)
        );

        res.json({
            success: true,
            thread
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/threads - Get all email threads
 */
export const getAllThreads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId, limit } = req.query;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const threads = await emailThreadService.getUserThreads(
            new mongoose.Types.ObjectId(userId),
            spaceId ? new mongoose.Types.ObjectId(spaceId as string) : undefined,
            limit ? parseInt(limit as string) : 50
        );

        res.json({
            success: true,
            count: threads.length,
            threads
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/threads/stats - Get thread statistics
 */
export const getThreadStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId } = req.query;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const stats = await emailThreadService.getThreadStats(
            new mongoose.Types.ObjectId(userId),
            spaceId ? new mongoose.Types.ObjectId(spaceId as string) : undefined
        );

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

// ==================== INBOX ENDPOINTS ====================

/**
 * GET /emails/inbox - Get paginated inbox with filters
 */
export const getInbox = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const {
            page = '1',
            limit = '20',
            search,
            hasAttachments,
            isRead,
            hasReply,
            isThreaded,
            startDate,
            endDate,
            spaceId
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const filter: any = {
            userId: new mongoose.Types.ObjectId(userId),
            direction: 'inbound'
        };

        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { 'from.email': { $regex: search, $options: 'i' } },
                { 'from.name': { $regex: search, $options: 'i' } },
                { bodyPlain: { $regex: search, $options: 'i' } }
            ];
        }

        if (hasAttachments === 'true') {
            filter.attachments = { $exists: true, $ne: [] };
        }

        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        if (hasReply === 'true') {
            filter.hasReply = true;
        }

        if (isThreaded === 'true') {
            filter.isReply = true;
        }

        if (startDate || endDate) {
            filter.receivedAt = {};
            if (startDate) filter.receivedAt.$gte = new Date(startDate as string);
            if (endDate) filter.receivedAt.$lte = new Date(endDate as string);
        }

        if (spaceId) {
            filter.importedToSpaceId = new mongoose.Types.ObjectId(spaceId as string);
        }

        // Get total count
        const total = await Email.countDocuments(filter);

        // Get emails
        const emails = await Email.find(filter)
            .sort({ receivedAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('importedToSpaceId', 'name')
            .populate('vendorId', 'name email')
            .lean();

        res.json({
            success: true,
            data: emails,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: skip + emails.length < total
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /emails/:id/import - Import Gmail email to a space
 */
export const importEmailToSpace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params; // This is the Gmail message ID
        const { spaceId } = req.body;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!spaceId) {
            throw new AppError('Space ID is required', 400);
        }

        // Check if email already exists in database
        let email: any = await Email.findOne({
            gmailMessageId: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        // If not exists, fetch from Gmail and save
        if (!email) {
            const auth = await (gmailAPIService as any).getAuthClientForUser(new mongoose.Types.ObjectId(userId));
            const gmail = (await import('googleapis')).google.gmail({ version: 'v1', auth });

            const messageData = await gmail.users.messages.get({
                userId: 'me',
                id: id,
                format: 'full'
            });

            const headers = messageData.data.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const from = getHeader('From') || '';
            const subject = getHeader('Subject') || '';
            const messageId = getHeader('Message-ID') || '';

            // Extract body
            let bodyPlain = '';
            let bodyHtml = '';
            const getBody = (part: any): void => {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    bodyPlain += Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                    bodyHtml += Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                if (part.parts) {
                    part.parts.forEach(getBody);
                }
            };
            if (messageData.data.payload) {
                getBody(messageData.data.payload);
            }

            // Create email in database
            email = await Email.create({
                userId: new mongoose.Types.ObjectId(userId),
                spaceId: new mongoose.Types.ObjectId(spaceId),
                gmailMessageId: id,
                threadId: messageData.data.threadId,
                messageId,
                from: {
                    email: from.match(/<(.+)>/)?.[1] || from,
                    name: from.replace(/<.+>/, '').trim()
                },
                to: [],
                subject,
                bodyPlain,
                bodyHtml,
                direction: 'inbound',
                provider: 'gmail',
                receivedAt: new Date(parseInt(messageData.data.internalDate || '0')),
                isImported: true,
                importedToSpaceId: new mongoose.Types.ObjectId(spaceId),
                importedAt: new Date(),
                processed: true
            } as any);
        } else {
            // Update existing email with import info
            email.isImported = true;
            email.importedToSpaceId = new mongoose.Types.ObjectId(spaceId);
            email.importedAt = new Date();
            await email.save();
        }

        res.json({
            success: true,
            message: 'Email imported to space successfully',
            data: email
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /emails/:id/map-vendor - Map email to a vendor
 */
export const mapEmailToVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { vendorId } = req.body;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!vendorId) {
            throw new AppError('Vendor ID is required', 400);
        }

        const email = await Email.findOne({
            _id: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!email) {
            throw new AppError('Email not found', 404);
        }

        // Update email with vendor mapping
        email.vendorId = new mongoose.Types.ObjectId(vendorId);
        await email.save();

        res.json({
            success: true,
            message: 'Email mapped to vendor successfully',
            data: email
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/imported/:spaceId - Get imported emails for a space
 */
export const getImportedEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const emails = await Email.find({
            userId: new mongoose.Types.ObjectId(userId),
            importedToSpaceId: new mongoose.Types.ObjectId(spaceId),
            isImported: true
        })
            .populate('vendorId', 'name email')
            .sort({ importedAt: -1 })
            .lean();

        res.json({
            success: true,
            count: emails.length,
            data: emails
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /emails/:id/mark-read - Mark email as read/unread
 */
export const markEmailAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { isRead = true } = req.body;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const email = await Email.findOneAndUpdate(
            {
                _id: id,
                userId: new mongoose.Types.ObjectId(userId)
            },
            { isRead },
            { new: true }
        );

        if (!email) {
            throw new AppError('Email not found', 404);
        }

        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/imported/count/:spaceId - Get count of imported emails for a space
 */
export const getImportedEmailsCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { spaceId } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const count = await Email.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            importedToSpaceId: new mongoose.Types.ObjectId(spaceId),
            isImported: true
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/gmail/inbox - Get Gmail inbox with pagination
 */
export const getGmailInbox = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { pageToken, maxResults = '20' } = req.query;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Get user's Gmail auth
        const auth = await (gmailAPIService as any).getAuthClientForUser(new mongoose.Types.ObjectId(userId));
        const gmail = (await import('googleapis')).google.gmail({ version: 'v1', auth });

        // List messages
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: parseInt(maxResults as string),
            pageToken: pageToken as string | undefined,
            labelIds: ['INBOX']
        });

        const messages = listResponse.data.messages || [];
        const emails: any = [];

        // Fetch full message details
        for (const message of messages) {
            const messageData = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full'
            });

            const headers = messageData.data.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const from = getHeader('From') || '';
            const subject = getHeader('Subject') || '(No Subject)';
            const date = getHeader('Date') || '';

            // Extract body
            let bodyPlain = '';
            const getBody = (part: any): void => {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    bodyPlain += Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                if (part.parts) {
                    part.parts.forEach(getBody);
                }
            };
            if (messageData.data.payload) {
                getBody(messageData.data.payload);
            }

            // Extract attachments
            const attachments: any[] = [];
            const extractAttachments = (part: any): void => {
                if (part.filename && part.body?.attachmentId) {
                    attachments.push({
                        filename: part.filename,
                        mimeType: part.mimeType || 'application/octet-stream',
                        size: part.body.size || 0,
                        attachmentId: part.body.attachmentId,
                        contentId: part.headers?.find((h: any) => h.name.toLowerCase() === 'content-id')?.value,
                        inline: part.headers?.some((h: any) =>
                            h.name.toLowerCase() === 'content-disposition' &&
                            h.value.toLowerCase().includes('inline')
                        ) || false
                    });
                }
                if (part.parts) {
                    part.parts.forEach(extractAttachments);
                }
            };
            extractAttachments(messageData.data.payload);

            // Check if already imported
            const existingEmail = await Email.findOne({
                gmailMessageId: message.id,
                userId: new mongoose.Types.ObjectId(userId)
            });

            emails.push({
                id: message.id,
                gmailMessageId: message.id,
                threadId: messageData.data.threadId,
                from: {
                    email: from.match(/<(.+)>/)?.[1] || from,
                    name: from.replace(/<.+>/, '').trim()
                },
                subject,
                bodyPlain: bodyPlain.substring(0, 200),
                date,
                attachments,
                isImported: !!existingEmail,
                importedToSpaceId: existingEmail?.importedToSpaceId,
                vendorId: existingEmail?.vendorId
            });
        }

        res.json({
            success: true,
            data: emails,
            nextPageToken: listResponse.data.nextPageToken,
            resultSizeEstimate: listResponse.data.resultSizeEstimate
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/debug/sent - Debug endpoint to check sent emails
 */
export const debugSentEmails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        const sentEmails = await Email.find({
            userId: new mongoose.Types.ObjectId(userId),
            direction: 'outbound'
        }).select('subject messageId threadId hasReply from to createdAt provider').sort({ createdAt: -1 }).limit(10);

        res.json({
            success: true,
            count: sentEmails.length,
            emails: sentEmails
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/:emailId/attachments/:attachmentId/download
 * Download attachment from Gmail
 */
export const downloadAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { emailId, attachmentId } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Try to find email by database ID first, then by Gmail message ID
        let email = await Email.findOne({
            _id: emailId,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!email) {
            // Try finding by Gmail message ID
            email = await Email.findOne({
                gmailMessageId: emailId,
                userId: new mongoose.Types.ObjectId(userId)
            });
        }

        // If still not found, we need to fetch from Gmail directly
        if (!email) {
            // This is a Gmail message that hasn't been imported yet
            // We'll download directly from Gmail
            const { gmailAttachmentService } = await import('../../common/services/gmail-attachment.service');
            const attachmentData = await gmailAttachmentService.downloadAttachment(
                new mongoose.Types.ObjectId(userId),
                emailId, // This is the Gmail message ID
                attachmentId
            );

            if (!attachmentData) {
                throw new AppError('Failed to download attachment', 500);
            }

            // Set response headers
            res.setHeader('Content-Type', attachmentData.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${attachmentData.filename}"`);
            res.setHeader('Content-Length', attachmentData.data.length);

            // Send file
            return res.send(attachmentData.data);
        }

        if (!email.gmailMessageId) {
            throw new AppError('Email does not have Gmail message ID', 400);
        }

        // Find attachment in email
        const attachment = email.attachments?.find(a => a.attachmentId === attachmentId);
        if (!attachment) {
            throw new AppError('Attachment not found', 404);
        }

        // Check file size limit (10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (attachment.size > MAX_SIZE) {
            throw new AppError('Attachment too large (max 10MB)', 400);
        }

        // Download from Gmail
        const { gmailAttachmentService } = await import('../../common/services/gmail-attachment.service');
        const attachmentData = await gmailAttachmentService.downloadAttachment(
            new mongoose.Types.ObjectId(userId),
            email.gmailMessageId,
            attachmentId
        );

        if (!attachmentData) {
            throw new AppError('Failed to download attachment', 500);
        }

        // Set response headers
        res.setHeader('Content-Type', attachmentData.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachmentData.filename}"`);
        res.setHeader('Content-Length', attachmentData.data.length);

        // Send file
        res.send(attachmentData.data);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /emails/:emailId/attachments/:attachmentId/preview
 * Preview attachment (inline display for images/PDFs)
 */
export const previewAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const { emailId, attachmentId } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        // Try to find email by database ID first, then by Gmail message ID
        let email = await Email.findOne({
            _id: emailId,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!email) {
            // Try finding by Gmail message ID
            email = await Email.findOne({
                gmailMessageId: emailId,
                userId: new mongoose.Types.ObjectId(userId)
            });
        }

        // If still not found, fetch directly from Gmail
        if (!email) {
            const { gmailAttachmentService } = await import('../../common/services/gmail-attachment.service');

            // Get attachment info first to check if previewable
            const attachmentInfo = await gmailAttachmentService.getAttachmentInfo(
                new mongoose.Types.ObjectId(userId),
                emailId,
                attachmentId
            );

            if (!attachmentInfo) {
                throw new AppError('Attachment not found', 404);
            }

            // Check if previewable
            const previewableMimeTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf',
                'text/plain', 'text/html', 'text/csv'
            ];

            if (!previewableMimeTypes.includes(attachmentInfo.mimeType)) {
                throw new AppError('Attachment type not previewable', 400);
            }

            // Check size limit (5MB for preview)
            const MAX_PREVIEW_SIZE = 5 * 1024 * 1024;
            if (attachmentInfo.size > MAX_PREVIEW_SIZE) {
                throw new AppError('Attachment too large for preview (max 5MB)', 400);
            }

            // Download attachment
            const attachmentData = await gmailAttachmentService.downloadAttachment(
                new mongoose.Types.ObjectId(userId),
                emailId,
                attachmentId
            );

            if (!attachmentData) {
                throw new AppError('Failed to download attachment', 500);
            }

            // Set response headers for inline display
            res.setHeader('Content-Type', attachmentData.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${attachmentData.filename}"`);
            res.setHeader('Content-Length', attachmentData.data.length);
            res.setHeader('X-Content-Type-Options', 'nosniff');

            // Send file
            return res.send(attachmentData.data);
        }

        if (!email.gmailMessageId) {
            throw new AppError('Email does not have Gmail message ID', 400);
        }

        // Find attachment
        const attachment = email.attachments?.find(a => a.attachmentId === attachmentId);
        if (!attachment) {
            throw new AppError('Attachment not found', 404);
        }

        // Check if previewable
        const previewableMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'text/plain', 'text/html', 'text/csv'
        ];

        if (!previewableMimeTypes.includes(attachment.mimeType)) {
            throw new AppError('Attachment type not previewable', 400);
        }

        // Check size limit (5MB for preview)
        const MAX_PREVIEW_SIZE = 5 * 1024 * 1024;
        if (attachment.size > MAX_PREVIEW_SIZE) {
            throw new AppError('Attachment too large for preview (max 5MB)', 400);
        }

        // Download from Gmail
        const { gmailAttachmentService } = await import('../../common/services/gmail-attachment.service');
        const attachmentData = await gmailAttachmentService.downloadAttachment(
            new mongoose.Types.ObjectId(userId),
            email.gmailMessageId,
            attachmentId
        );

        if (!attachmentData) {
            throw new AppError('Failed to download attachment', 500);
        }

        // Set response headers for inline display
        res.setHeader('Content-Type', attachmentData.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${attachmentData.filename}"`);
        res.setHeader('Content-Length', attachmentData.data.length);
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send file
        res.send(attachmentData.data);
    } catch (error) {
        next(error);
    }
};

