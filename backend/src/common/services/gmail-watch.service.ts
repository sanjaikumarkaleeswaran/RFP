import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailToken } from '../../modules/email/gmail-token.model';
import { Email } from '../../modules/email/model';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
];

class GmailWatchService {
    private credentials: any = null;
    private watchIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.loadCredentials();
    }

    private loadCredentials() {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                console.warn('⚠️  Gmail watch not started: OAuth credentials not found in environment');
                console.warn('   Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env file');
                return;
            }

            this.credentials = {
                web: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [redirectUri]
                }
            };

            console.log('✅ Gmail watch credentials loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load Gmail credentials:', error);
            this.credentials = null;
        }
    }

    /**
     * Get authenticated Gmail client for user
     */
    private async getAuthClient(userId: mongoose.Types.ObjectId): Promise<OAuth2Client | null> {
        if (!this.credentials) return null;

        const tokenDoc = await GmailToken.findOne({ userId, isActive: true });
        if (!tokenDoc) return null;

        const oauth2Client = new google.auth.OAuth2(
            this.credentials.web.client_id,
            this.credentials.web.client_secret,
            this.credentials.web.redirect_uris[0]
        );

        oauth2Client.setCredentials({
            access_token: tokenDoc.accessToken,
            refresh_token: tokenDoc.refreshToken,
            scope: tokenDoc.scope,
            token_type: tokenDoc.tokenType,
            expiry_date: tokenDoc.expiryDate
        });

        // Handle token refresh
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await GmailToken.findOneAndUpdate(
                    { userId },
                    {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || tokenDoc.refreshToken,
                        expiryDate: tokens.expiry_date!
                    }
                );
            }
        });

        return oauth2Client;
    }

    /**
     * Start watching for replies for a specific user
     * This runs continuously in the background
     */
    async startWatching(userId: mongoose.Types.ObjectId, intervalSeconds: number = 30) {
        const userIdStr = userId.toString();

        // Stop existing watch if any
        this.stopWatching(userId);

        console.log(`🔍 Starting Gmail watch for user: ${userIdStr}`);
        console.log(`⏱️  Checking every ${intervalSeconds} seconds`);

        // Initial check
        await this.checkForReplies(userId);

        // Set up interval to check periodically
        const interval = setInterval(async () => {
            try {
                await this.checkForReplies(userId);
            } catch (error) {
                console.error(`❌ Error checking replies for user ${userIdStr}:`, error);
            }
        }, intervalSeconds * 1000);

        this.watchIntervals.set(userIdStr, interval);
        console.log(`✅ Gmail watch started for user: ${userIdStr}`);
    }

    /**
     * Stop watching for a specific user
     */
    stopWatching(userId: mongoose.Types.ObjectId) {
        const userIdStr = userId.toString();
        const interval = this.watchIntervals.get(userIdStr);

        if (interval) {
            clearInterval(interval);
            this.watchIntervals.delete(userIdStr);
            console.log(`⏹️  Gmail watch stopped for user: ${userIdStr}`);
        }
    }

    /**
     * Check for new replies to sent emails
     */
    async checkForReplies(userId: mongoose.Types.ObjectId): Promise<any[]> {

        try {
            const auth = await this.getAuthClient(userId);
            if (!auth) {
                console.log('⚠️  No Gmail auth for user, skipping check');
                return [];
            }

            const gmail = google.gmail({ version: 'v1', auth });

            // Get all sent emails from this user that don't have replies yet
            const sentEmails = await Email.find({
                userId,
                direction: 'outbound',
                hasReply: { $ne: true },
                messageId: { $exists: true, $ne: null }
            }).select('messageId threadId subject to');

            console.log(`🔍 Found ${sentEmails.length} sent emails in database`);

            if (sentEmails.length > 0) {
                console.log('📧 Sample sent email:', {
                    subject: sentEmails[0].subject,
                    messageId: sentEmails[0].messageId,
                    threadId: sentEmails[0].threadId,
                    to: sentEmails[0].to
                });
            }

            if (sentEmails.length === 0) {
                console.log('📭 No sent emails waiting for replies');
                return [];
            }

            console.log(`🔍 Checking ${sentEmails.length} sent emails for replies...`);

            const replies: any[] = [];

            // Check each sent email for replies
            for (const sentEmail of sentEmails) {
                try {
                    // Search for emails in the same thread
                    const query = sentEmail.threadId
                        ? `in:inbox thread:${sentEmail.threadId}`
                        : `in:inbox subject:"Re: ${sentEmail.subject}"`;

                    console.log(`🔍 Searching Gmail with query: "${query}"`);

                    const response = await gmail.users.messages.list({
                        userId: 'me',
                        q: query,
                        maxResults: 10
                    });

                    const messages = response.data.messages || [];
                    console.log(`   Found ${messages.length} messages in Gmail for this thread`);

                    for (const message of messages) {
                        // Get full message details
                        const messageData = await gmail.users.messages.get({
                            userId: 'me',
                            id: message.id!,
                            format: 'full'
                        });

                        // Check if this is actually a reply (not the original email)
                        const headers = messageData.data.payload?.headers || [];
                        const getHeader = (name: string) =>
                            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

                        const inReplyTo = getHeader('In-Reply-To');
                        const messageId = getHeader('Message-ID');
                        const gmailMessageId = messageData.data.id;

                        // Check if we already saved this reply - use comprehensive check
                        const existingReply = await Email.findOne({
                            $or: [
                                { messageId: messageId },
                                { gmailMessageId: gmailMessageId }
                            ]
                        });

                        if (existingReply) {
                            console.log('⚠️  Reply already processed (Email ID:', existingReply._id, ')');
                            continue; // Already processed this reply
                        }

                        // Check if this is a reply to our sent email
                        const isReplyToOurEmail = inReplyTo === sentEmail.messageId ||
                            messageData.data.threadId === sentEmail.threadId;

                        if (isReplyToOurEmail) {
                            console.log('💬 NEW REPLY DETECTED!');

                            const reply = await this.saveReply(messageData.data, userId, sentEmail);
                            if (reply) {
                                replies.push(reply);

                                // Mark original email as having a reply
                                await Email.findByIdAndUpdate(sentEmail._id, {
                                    hasReply: true,
                                    repliedAt: new Date()
                                });

                                console.log(`✅ Reply saved for email: ${sentEmail.subject}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error checking email ${sentEmail._id}:`, error);
                }
            }

            if (replies.length > 0) {
                console.log(`✅ Found and saved ${replies.length} new ${replies.length === 1 ? 'reply' : 'replies'}`);
            } else {
                console.log('📭 No new replies found');
            }

            return replies;

        } catch (error) {
            console.error('❌ Error checking for replies:', error);
            throw error;
        }
    }

    /**
     * Parse and save Gmail reply to database
     */
    private async saveReply(message: any, userId: mongoose.Types.ObjectId, originalEmail: any): Promise<any> {
        try {
            const headers = message.payload.headers;
            const getHeader = (name: string) =>
                headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const from = getHeader('From');
            const to = getHeader('To');
            const subject = getHeader('Subject');
            const messageId = getHeader('Message-ID');
            const inReplyTo = getHeader('In-Reply-To');
            const references = getHeader('References')?.split(' ') || [];
            const threadId = message.threadId;
            const gmailMessageId = message.id;
            const receivedDate = new Date(parseInt(message.internalDate));

            console.log('📧 Processing reply...');
            console.log('   Gmail Message ID:', gmailMessageId);
            console.log('   Message-ID Header:', messageId);
            console.log('   Thread ID:', threadId);
            console.log('   From:', from);

            // COMPREHENSIVE DUPLICATE CHECK - Check multiple unique identifiers
            const existingReply = await Email.findOne({
                $or: [
                    // Check by Message-ID header (most reliable)
                    { messageId: messageId },
                    // Check by Gmail's internal message ID
                    { gmailMessageId: gmailMessageId },
                    // Check by combination of threadId and timestamp (for emails without Message-ID)
                    {
                        threadId: threadId,
                        receivedAt: receivedDate,
                        'from.email': from?.match(/<(.+)>/)?.[1] || from
                    }
                ]
            });

            if (existingReply) {
                console.log('⚠️  Reply already exists in database (ID:', existingReply._id, '), skipping save');
                return null;
            }

            // Extract email body
            let bodyPlain = '';
            let bodyHtml = '';

            const getBody = (part: any): void => {
                if (part.mimeType === 'text/plain' && part.body.data) {
                    bodyPlain += Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.mimeType === 'text/html' && part.body.data) {
                    bodyHtml += Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                if (part.parts) {
                    part.parts.forEach(getBody);
                }
            };

            getBody(message.payload);

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
            extractAttachments(message.payload);

            // Extract sender email
            const fromEmail = from?.match(/<(.+)>/)?.[1] || from;
            const fromName = from?.replace(/<.+>/, '').trim();

            // Log the reply data
            console.log('📧 Reply Details:');
            console.log('  From:', fromEmail);
            console.log('  Subject:', subject);
            console.log('  Thread ID:', threadId);
            console.log('  In-Reply-To:', inReplyTo);
            console.log('  Attachments:', attachments.length);
            console.log('  Body Preview:', bodyPlain?.substring(0, 100) + '...');

            // Save to database
            const replyEmail = await Email.create({
                userId,
                spaceId: originalEmail.spaceId,
                from: {
                    email: fromEmail,
                    name: fromName
                },
                to: [{ email: to }],
                subject,
                bodyPlain,
                bodyHtml,
                attachments,
                messageId,
                inReplyTo,
                references,
                threadId,
                gmailMessageId,
                direction: 'inbound',
                provider: 'gmail',
                deliveryStatus: 'delivered',
                receivedAt: receivedDate,
                processed: true,
                isReply: true,
                originalEmailId: originalEmail._id
            });

            console.log('✅ Reply saved to database!');
            console.log('  Reply ID:', replyEmail._id);

            return {
                id: replyEmail._id,
                from: fromEmail,
                subject,
                threadId,
                bodyPlain,
                bodyHtml,
                isReply: true,
                originalEmailId: originalEmail._id,
                receivedAt: replyEmail.receivedAt
            };

        } catch (error) {
            console.error('❌ Error saving reply:', error);
            return null;
        }
    }

    /**
     * Start watching for all users with active Gmail connections
     */
    async startWatchingAllUsers(intervalSeconds: number = 30) {
        try {
            if (!this.credentials) {
                console.log('⚠️  Gmail watch not started: OAuth credentials not configured');
                console.log('   To enable Gmail watch:');
                console.log('   1. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env');
                console.log('   2. Restart the server');
                return;
            }

            const activeTokens = await GmailToken.find({ isActive: true });

            if (activeTokens.length === 0) {
                console.log('📭 No Gmail accounts connected yet');
                console.log('   Gmail watch will start automatically when users connect their Gmail');
                return;
            }

            console.log(`🔍 Starting Gmail watch for ${activeTokens.length} ${activeTokens.length === 1 ? 'user' : 'users'}`);

            for (const token of activeTokens) {
                try {
                    await this.startWatching(token.userId, intervalSeconds);
                } catch (error) {
                    console.error(`❌ Failed to start watch for user ${token.userId}:`, error);
                }
            }

            console.log('✅ Gmail watch initialization complete');
        } catch (error) {
            console.error('❌ Error starting watch for all users:', error);
        }
    }

    /**
     * Stop watching for all users
     */
    stopWatchingAllUsers() {
        for (const [userId, interval] of this.watchIntervals.entries()) {
            clearInterval(interval);
            console.log(`⏹️  Stopped watching for user: ${userId}`);
        }
        this.watchIntervals.clear();
        console.log('⏹️  All Gmail watches stopped');
    }
}

export const gmailWatchService = new GmailWatchService();
