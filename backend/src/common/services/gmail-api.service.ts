import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailToken, IGmailToken } from '../../modules/email/gmail-token.model';
import { Email } from '../../modules/email/model';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
];

class GmailAPIService {
    private oauth2Client: OAuth2Client | null = null;
    private credentials: any = null;

    constructor() {
        this.loadCredentials();
    }

    /**
     * Load OAuth2 credentials from environment variables
     */
    private loadCredentials() {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                console.warn('⚠️  Gmail OAuth credentials not found in environment variables.');
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

            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                redirectUri
            );

            console.log('✅ Gmail API credentials loaded from environment variables');
        } catch (error) {
            console.error('❌ Failed to load Gmail credentials:', error);
        }
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl(userId: string): string {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized. Please add credentials.json');
        }

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            state: userId // Pass userId in state to identify user after callback
        });

        return authUrl;
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code: string, userId: mongoose.Types.ObjectId): Promise<IGmailToken> {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized');
        }

        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);

        // Get user's email address
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });

        // Save tokens to database
        const gmailToken = await GmailToken.findOneAndUpdate(
            { userId },
            {
                userId,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
                scope: tokens.scope!,
                tokenType: tokens.token_type!,
                expiryDate: tokens.expiry_date!,
                email: profile.data.emailAddress,
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log('✅ Gmail tokens saved for user:', userId);
        return gmailToken;
    }

    /**
     * Get OAuth2 client for a specific user
     */
    private async getAuthClientForUser(userId: mongoose.Types.ObjectId): Promise<OAuth2Client> {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized');
        }
        console.log({ userId })


        const tokenDoc = await GmailToken.findOne({ userId, isActive: true });
        if (!tokenDoc) {
            throw new Error('No active Gmail connection found for this user');
        }

        const oauth2Client = new google.auth.OAuth2(
            this.credentials.web?.client_id || this.credentials.installed?.client_id,
            this.credentials.web?.client_secret || this.credentials.installed?.client_secret,
            this.credentials.web?.redirect_uris[0] || this.credentials.installed?.redirect_uris[0]
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
            if (tokens.refresh_token) {
                await GmailToken.findOneAndUpdate(
                    { userId },
                    {
                        accessToken: tokens.access_token!,
                        refreshToken: tokens.refresh_token,
                        expiryDate: tokens.expiry_date!
                    }
                );
            } else if (tokens.access_token) {
                await GmailToken.findOneAndUpdate(
                    { userId },
                    {
                        accessToken: tokens.access_token,
                        expiryDate: tokens.expiry_date!
                    }
                );
            }
        });

        return oauth2Client;
    }

    /**
     * Send email via Gmail API
     */
    async sendEmail(
        userId: mongoose.Types.ObjectId,
        to: string,
        subject: string,
        text?: string,
        html?: string,
        spaceId?: mongoose.Types.ObjectId
    ): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
        try {
            console.log('📧 Sending email via Gmail API...', { userId, to, subject });
            const auth = await this.getAuthClientForUser(userId);
            const gmail = google.gmail({ version: 'v1', auth });

            // Create email message
            const message = this.createEmailMessage(to, subject, text, html);
            const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            // Send email
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            console.log('✅ Email sent via Gmail API to:', to);
            console.log('   Gmail Message ID:', response.data.id);
            console.log('   Thread ID:', response.data.threadId);

            // Get the full message details to extract the actual Message-ID header
            const sentMessage = await gmail.users.messages.get({
                userId: 'me',
                id: response.data.id!,
                format: 'full'
            });

            const headers = sentMessage.data.payload?.headers || [];
            const getHeader = (name: string) =>
                headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const actualMessageId = getHeader('Message-ID');
            console.log('   Message-ID Header:', actualMessageId);

            // Check for duplicate before saving
            const existingEmail = await Email.findOne({
                $or: [
                    { gmailMessageId: response.data.id },
                    { messageId: actualMessageId }
                ]
            });

            if (existingEmail) {
                console.log('⚠️  Email already exists in database, skipping save');
                return {
                    success: true,
                    messageId: response.data.id!,
                    threadId: response.data.threadId!
                };
            }

            // Save to database
            const tokenDoc = await GmailToken.findOne({ userId });
            const emailDoc = await Email.create({
                userId,
                spaceId,
                from: {
                    email: tokenDoc?.email || 'unknown',
                    name: 'Me'
                },
                to: [{ email: to }],
                subject,
                bodyPlain: text,
                bodyHtml: html,
                messageId: actualMessageId, // Use actual Message-ID header
                threadId: response.data.threadId,
                gmailMessageId: response.data.id, // Store Gmail's internal ID separately
                direction: 'outbound',
                provider: 'gmail',
                deliveryStatus: 'sent',
                processed: true,
                receivedAt: new Date()
            } as any);

            console.log('✅ Email saved to database with ID:', (emailDoc as any)._id);

            return {
                success: true,
                messageId: response.data.id!,
                threadId: response.data.threadId!
            };
        } catch (error) {
            console.error('❌ Failed to send email via Gmail API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create RFC 2822 formatted email message
     */
    private createEmailMessage(to: string, subject: string, text?: string, html?: string): string {
        const messageParts = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            html || text || ''
        ];

        return messageParts.join('\n');
    }

    /**
     * Check for new replies in Gmail
     */
    async checkReplies(userId: mongoose.Types.ObjectId): Promise<any[]> {
        try {
            const auth = await this.getAuthClientForUser(userId);
            const gmail = google.gmail({ version: 'v1', auth });

            // Search for unread messages from the last day
            const query = 'is:unread newer_than:1d';
            const response = await gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: 50
            });

            const messages = response.data.messages || [];
            const replies: any[] = [];

            for (const message of messages) {
                const messageData = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'full'
                });

                const reply = await this.parseGmailMessage(messageData.data, userId);
                if (reply) {
                    replies.push(reply);

                    // Mark as read
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: message.id!,
                        requestBody: {
                            removeLabelIds: ['UNREAD']
                        }
                    });
                }
            }

            console.log(`✅ Found ${replies.length} new replies`);
            return replies;
        } catch (error) {
            console.error('❌ Failed to check Gmail replies:', error);
            throw error;
        }
    }

    /**
     * Parse Gmail message and save to database
     */
    private async parseGmailMessage(message: any, userId: mongoose.Types.ObjectId): Promise<any> {
        try {
            const headers = message.payload.headers;
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const from = getHeader('From');
            const to = getHeader('To');
            const subject = getHeader('Subject');
            const messageId = getHeader('Message-ID');
            const inReplyTo = getHeader('In-Reply-To');
            const references = getHeader('References')?.split(' ') || [];
            const threadId = message.threadId;
            const gmailMessageId = message.id;
            const receivedDate = new Date(parseInt(message.internalDate));

            console.log('📧 Parsing Gmail message...');
            console.log('   Gmail Message ID:', gmailMessageId);
            console.log('   Message-ID Header:', messageId);
            console.log('   From:', from);

            // COMPREHENSIVE DUPLICATE CHECK
            const existingEmail = await Email.findOne({
                $or: [
                    { messageId: messageId },
                    { gmailMessageId: gmailMessageId }
                ]
            });

            if (existingEmail) {
                console.log('⚠️  Email already exists in database (ID:', existingEmail._id, '), skipping save');
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
                        storagePath: '', // Will be populated when attachment is downloaded
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

            // Check if this is a reply to one of our sent emails
            let originalEmail: any = null;
            let isReply = false;

            if (inReplyTo || threadId) {
                originalEmail = await Email.findOne({
                    userId,
                    direction: 'outbound',
                    $or: [
                        { messageId: inReplyTo },
                        { threadId: threadId },
                        { gmailMessageId: threadId }
                    ]
                }).lean();

                isReply = !!originalEmail;
            }

            // Extract sender email
            const fromEmail = from?.match(/<(.+)>/)?.[1] || from;

            console.log('✅ Saving new email to database...');
            console.log('   Is Reply:', isReply);
            console.log('   Has Attachments:', attachments.length > 0);

            // Save to database
            const emailDoc = await Email.create({
                userId,
                spaceId: originalEmail?.spaceId,
                from: {
                    email: fromEmail,
                    name: from?.replace(/<.+>/, '').trim()
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
                isReply,
                originalEmailId: originalEmail?._id
            } as any);

            console.log('✅ Email saved with ID:', (emailDoc as any)._id);

            return {
                id: (emailDoc as any)._id.toString(),
                from: fromEmail,
                subject,
                threadId,
                bodyPlain,
                bodyHtml,
                isReply,
                originalEmailId: originalEmail?._id,
                receivedAt: (emailDoc as any).receivedAt
            };
        } catch (error) {
            console.error('Failed to parse Gmail message:', error);
            return null;
        }
    }

    /**
     * Disconnect Gmail for a user
     */
    async disconnect(userId: mongoose.Types.ObjectId): Promise<void> {
        await GmailToken.findOneAndUpdate(
            { userId },
            { isActive: false }
        );
        console.log('✅ Gmail disconnected for user:', userId);
    }

    /**
     * Check if user has active Gmail connection
     */
    async isConnected(userId: mongoose.Types.ObjectId): Promise<boolean> {
        const token = await GmailToken.findOne({ userId, isActive: true });
        return !!token;
    }

    /**
     * Get Gmail account info for user
     */
    async getAccountInfo(userId: mongoose.Types.ObjectId): Promise<{ email?: string; connected: boolean }> {
        const token = await GmailToken.findOne({ userId, isActive: true });
        return {
            email: token?.email,
            connected: !!token
        };
    }
}

export const gmailAPIService = new GmailAPIService();
