import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailToken } from '../../modules/email/gmail-token.model';
import { Email } from '../../modules/email/model';
import mongoose from 'mongoose';
import crypto from 'crypto';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
];

interface WatchResponse {
    historyId: string;
    expiration: string;
}

interface GmailNotification {
    emailAddress: string;
    historyId: string;
}

class GmailWebhookService {
    private credentials: any = null;
    private watchedUsers: Map<string, WatchResponse> = new Map();
    private pubSubTopic: string;

    constructor() {
        this.loadCredentials();
        // Format: projects/{project-id}/topics/{topic-name}
        this.pubSubTopic = process.env.GMAIL_PUBSUB_TOPIC || '';
    }

    private loadCredentials() {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                console.warn('⚠️  Gmail webhook not configured: OAuth credentials not found in environment');
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

            console.log('✅ Gmail webhook credentials loaded successfully');
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
     * Start watching a user's Gmail inbox using push notifications
     */
    async startWatch(userId: mongoose.Types.ObjectId): Promise<WatchResponse | null> {
        try {
            if (!this.pubSubTopic) {
                throw new Error('GMAIL_PUBSUB_TOPIC not configured in environment variables');
            }

            const auth = await this.getAuthClient(userId);
            if (!auth) {
                console.log('⚠️  No Gmail auth for user, cannot start watch');
                return null;
            }

            const gmail = google.gmail({ version: 'v1', auth });

            // Set up Gmail push notifications
            const response = await gmail.users.watch({
                userId: 'me',
                requestBody: {
                    topicName: this.pubSubTopic,
                    labelIds: ['INBOX'], // Only watch inbox
                    labelFilterAction: 'include'
                }
            });

            console.log({ response })

            const watchData: WatchResponse = {
                historyId: response.data.historyId!,
                expiration: response.data.expiration!
            };

            // Store watch data
            this.watchedUsers.set(userId.toString(), watchData);

            // Update token document with watch info
            await GmailToken.findOneAndUpdate(
                { userId },
                {
                    watchHistoryId: watchData.historyId,
                    watchExpiration: new Date(parseInt(watchData.expiration))
                }
            );

            console.log(`✅ Gmail watch started for user: ${userId}`);
            console.log(`   History ID: ${watchData.historyId}`);
            console.log(`   Expires: ${new Date(parseInt(watchData.expiration)).toISOString()}`);

            return watchData;
        } catch (error: any) {
            console.error(`❌ Error starting Gmail watch for user ${userId}:`, error.message);
            throw error;
        }
    }

    /**
     * Stop watching a user's Gmail inbox
     */
    async stopWatch(userId: mongoose.Types.ObjectId): Promise<void> {
        try {
            const auth = await this.getAuthClient(userId);
            if (!auth) {
                console.log('⚠️  No Gmail auth for user, cannot stop watch');
                return;
            }

            const gmail = google.gmail({ version: 'v1', auth });

            // Stop watching
            await gmail.users.stop({
                userId: 'me'
            });

            // Remove from watched users
            this.watchedUsers.delete(userId.toString());

            // Clear watch info from token
            await GmailToken.findOneAndUpdate(
                { userId },
                {
                    $unset: { watchHistoryId: '', watchExpiration: '' }
                }
            );

            console.log(`⏹️  Gmail watch stopped for user: ${userId}`);
        } catch (error: any) {
            console.error(`❌ Error stopping Gmail watch for user ${userId}:`, error.message);
            throw error;
        }
    }

    /**
     * Handle incoming webhook notification from Gmail
     */
    async handleNotification(notification: GmailNotification): Promise<void> {
        try {
            console.log('📬 Received Gmail notification:', notification);

            // Find user by email address
            const tokenDoc = await GmailToken.findOne({
                email: notification.emailAddress,
                isActive: true
            });

            if (!tokenDoc) {
                console.log(`⚠️  No active token found for email: ${notification.emailAddress}`);
                return;
            }

            const userId = tokenDoc.userId;

            // OPTIMIZATION: Check if user has any outbound emails to match against
            const hasOutboundEmails = await Email.exists({
                userId,
                direction: 'outbound',
                messageId: { $exists: true, $ne: null }
            });

            if (!hasOutboundEmails) {
                console.log(`⏭️  User has no outbound emails yet, skipping notification processing`);
                // Still update history ID to avoid reprocessing
                await GmailToken.findOneAndUpdate(
                    { userId },
                    { watchHistoryId: notification.historyId }
                );
                return;
            }

            const auth = await this.getAuthClient(userId);
            if (!auth) {
                console.log('⚠️  No Gmail auth for user');
                return;
            }

            const gmail = google.gmail({ version: 'v1', auth });

            // Get the stored history ID
            const lastHistoryId = tokenDoc.watchHistoryId || notification.historyId;

            // Fetch history since last check
            const historyResponse = await gmail.users.history.list({
                userId: 'me',
                startHistoryId: lastHistoryId,
                historyTypes: ['messageAdded'],
                labelId: 'INBOX'
            });

            const history = historyResponse.data.history || [];

            if (history.length === 0) {
                console.log(`📭 No new messages in history`);
            } else {
                console.log(`📜 Processing ${history.length} history record(s)`);
            }

            // Process new messages
            let repliesFound = 0;
            for (const record of history) {
                if (record.messagesAdded) {
                    for (const addedMessage of record.messagesAdded) {
                        const message = addedMessage.message;
                        if (message?.id) {
                            const wasReply = await this.processNewMessage(gmail, message.id, userId);
                            if (wasReply) repliesFound++;
                        }
                    }
                }
            }

            if (repliesFound > 0) {
                console.log(`✅ Processed ${repliesFound} reply/replies to your sent emails`);
            }

            // Update history ID
            await GmailToken.findOneAndUpdate(
                { userId },
                { watchHistoryId: notification.historyId }
            );

        } catch (error: any) {
            console.error('❌ Error handling Gmail notification:', error.message);
            throw error;
        }
    }

    /**
     * Process a new message to check if it's a reply to our sent emails
     * @returns true if message was a reply to our sent email, false otherwise
     */
    private async processNewMessage(gmail: any, messageId: string, userId: mongoose.Types.ObjectId): Promise<boolean> {
        try {
            // Get full message details
            const messageData = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            const message = messageData.data;
            const headers = message.payload?.headers || [];
            const getHeader = (name: string) =>
                headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const inReplyTo = getHeader('In-Reply-To');
            const references = getHeader('References');
            const messageIdHeader = getHeader('Message-ID');
            const threadId = message.threadId;
            const subject = getHeader('Subject');

            // OPTIMIZATION: Skip if no reply indicators at all
            if (!inReplyTo && !threadId) {
                console.log(`⏭️  Skipping message (no reply indicators): ${subject || messageId}`);
                return false;
            }

            // Check if we already processed this message
            const existingEmail = await Email.findOne({
                $or: [
                    { messageId: messageIdHeader },
                    { gmailMessageId: messageId }
                ]
            });

            if (existingEmail) {
                console.log('📭 Message already processed, skipping');
                console.log('  Existing email ID:', existingEmail._id);
                console.log('  Direction:', existingEmail.direction);
                return false;
            }

            // Check if this email is FROM the authenticated user
            // If yes, check if it was already saved as outbound (sent via API)
            // If already saved as outbound, skip. Otherwise, it's a reply from Gmail app - process it!
            const tokenDoc = await GmailToken.findOne({ userId, isActive: true });
            const from = getHeader('From');

            if (tokenDoc && from && messageIdHeader) {
                const fromEmail = from.match(/<(.+)>/)?.[1] || from;
                const userEmail = tokenDoc.email?.toLowerCase();
                const isFromUser = fromEmail.toLowerCase() === userEmail;

                console.log('🔍 Checking if email is from user:');
                console.log('  From:', fromEmail);
                console.log('  User email:', userEmail);
                console.log('  Is from user:', isFromUser);

                if (isFromUser) {
                    // Check if already saved as outbound
                    const outboundEmail = await Email.findOne({
                        messageId: messageIdHeader,
                        direction: 'outbound',
                        userId
                    });

                    if (outboundEmail) {
                        console.log('⏭️  Skipping - already saved as outbound (sent via API)');
                        console.log('  Outbound email ID:', outboundEmail._id);
                        return false;
                    } else {
                        console.log('✅ Email from user but NOT saved as outbound - this is a reply from Gmail app!');
                    }
                }
            }

            // Check if this is a reply to any of our sent emails
            let originalEmail: any = null;

            // First, try to find by In-Reply-To header (most reliable)
            if (inReplyTo) {
                originalEmail = await Email.findOne({
                    userId,
                    messageId: inReplyTo,
                    direction: 'outbound'
                });

                if (originalEmail) {
                    console.log(`🔗 Found original email by In-Reply-To: ${originalEmail.subject}`);
                }
            }

            // If not found, try by threadId (less reliable but catches some cases)
            if (!originalEmail && threadId) {
                originalEmail = await Email.findOne({
                    userId,
                    threadId,
                    direction: 'outbound'
                });

                if (originalEmail) {
                    console.log(`🔗 Found original email by threadId: ${originalEmail.subject}`);
                }
            }

            // Only process and save if this is a reply to our sent email
            if (originalEmail) {
                console.log('💬 NEW REPLY DETECTED!');
                console.log(`   From: ${getHeader('From')}`);
                console.log(`   Subject: ${subject}`);
                console.log(`   Original Email: ${originalEmail.subject}`);

                await this.saveReply(message, userId, originalEmail);

                // Mark original email as having a reply
                await Email.findByIdAndUpdate(originalEmail._id, {
                    hasReply: true,
                    repliedAt: new Date()
                });

                console.log(`✅ Reply saved and linked to original email`);
                return true; // This was a reply to our sent email
            } else {
                // This is an inbox message but NOT a reply to our emails - skip silently
                console.log(`⏭️  Skipping non-reply message: ${subject || messageId}`);
                return false; // Not a reply to our sent email
            }

        } catch (error: any) {
            console.error('❌ Error processing new message:', error.message);
            return false;
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

            // ========================================
            // LOG THE COMPLETE RECEIVED EMAIL
            // ========================================
            console.log('\n' + '='.repeat(60));
            console.log('📨 RECEIVED EMAIL (Reply to your sent email)');
            console.log('='.repeat(60));
            console.log('From:', fromEmail, fromName ? `(${fromName})` : '');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Thread ID:', threadId);
            console.log('Message ID:', messageId);
            console.log('In-Reply-To:', inReplyTo);
            console.log('Received At:', new Date(parseInt(message.internalDate)).toISOString());
            console.log('Attachments:', attachments.length);
            if (attachments.length > 0) {
                attachments.forEach((att, i) => {
                    console.log(`  ${i + 1}. ${att.filename} (${att.mimeType}, ${att.size} bytes)`);
                });
            }
            console.log('Body (Plain Text Preview):');
            console.log(bodyPlain?.substring(0, 200) + (bodyPlain?.length > 200 ? '...' : ''));
            console.log('='.repeat(60) + '\n');

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
                gmailMessageId: message.id,
                direction: 'inbound',
                provider: 'gmail',
                deliveryStatus: 'delivered',
                receivedAt: new Date(parseInt(message.internalDate)),
                processed: true,
                isReply: true,
                originalEmailId: originalEmail._id
            });

            console.log('✅ Reply saved to database!');
            console.log('  Reply ID:', replyEmail._id);
            console.log('  Linked to Original Email ID:', originalEmail._id);

            return replyEmail;

        } catch (error) {
            console.error('❌ Error saving reply:', error);
            return null;
        }
    }

    /**
     * Start watching all users with active Gmail connections
     */
    async startWatchingAllUsers(): Promise<void> {
        try {
            if (!this.credentials) {
                console.log('⚠️  Gmail webhook not started: OAuth credentials not configured');
                return;
            }

            if (!this.pubSubTopic) {
                console.log('⚠️  Gmail webhook not started: GMAIL_PUBSUB_TOPIC not configured');
                console.log('   To enable Gmail webhooks:');
                console.log('   1. Create a Google Cloud Pub/Sub topic');
                console.log('   2. Set GMAIL_PUBSUB_TOPIC in .env (format: projects/{project-id}/topics/{topic-name})');
                console.log('   3. Grant Gmail API permission to publish to the topic');
                console.log('   4. Restart the server');
                return;
            }

            const activeTokens = await GmailToken.find({ isActive: true });

            if (activeTokens.length === 0) {
                console.log('📭 No Gmail accounts connected yet');
                return;
            }

            console.log(`🔔 Starting Gmail webhooks for ${activeTokens.length} ${activeTokens.length === 1 ? 'user' : 'users'}`);

            for (const token of activeTokens) {
                try {
                    await this.startWatch(token.userId);
                } catch (error: any) {
                    console.error(`❌ Failed to start watch for user ${token.userId}:`, error.message);
                }
            }

            console.log('✅ Gmail webhook initialization complete');
        } catch (error: any) {
            console.error('❌ Error starting watch for all users:', error.message);
        }
    }

    /**
     * Renew watch for a user (watches expire after 7 days)
     */
    async renewWatch(userId: mongoose.Types.ObjectId): Promise<void> {
        try {
            console.log(`🔄 Renewing Gmail watch for user: ${userId}`);
            await this.stopWatch(userId);
            await this.startWatch(userId);
        } catch (error: any) {
            console.error(`❌ Error renewing watch for user ${userId}:`, error.message);
            throw error;
        }
    }

    /**
     * Verify Pub/Sub notification signature (for security)
     */
    verifyNotification(data: string, signature: string): boolean {
        // Implement signature verification if needed
        // This depends on your Pub/Sub setup
        return true;
    }
}

export const gmailWebhookService = new GmailWebhookService();
