import { google } from 'googleapis';
import { gmailAPIService } from './gmail-api.service';
import { GmailToken } from '../../modules/email/gmail-token.model';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

class GmailAttachmentService {
    /**
     * Download attachment from Gmail
     */
    async downloadAttachment(
        userId: mongoose.Types.ObjectId,
        gmailMessageId: string,
        attachmentId: string
    ): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
        try {
            // Get auth client
            const tokenDoc = await GmailToken.findOne({ userId, isActive: true });
            if (!tokenDoc) {
                throw new Error('No active Gmail connection');
            }

            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI;

            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
            oauth2Client.setCredentials({
                access_token: tokenDoc.accessToken,
                refresh_token: tokenDoc.refreshToken,
                scope: tokenDoc.scope,
                token_type: tokenDoc.tokenType,
                expiry_date: tokenDoc.expiryDate
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Get attachment
            const attachment = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: gmailMessageId,
                id: attachmentId
            });

            if (!attachment.data.data) {
                return null;
            }

            // Decode base64url data
            const data = Buffer.from(attachment.data.data, 'base64url');

            // Get message to find filename and mimeType
            const message = await gmail.users.messages.get({
                userId: 'me',
                id: gmailMessageId,
                format: 'full'
            });

            let filename = 'attachment';
            let mimeType = 'application/octet-stream';

            const findAttachment = (part: any): void => {
                if (part.body?.attachmentId === attachmentId) {
                    filename = part.filename || 'attachment';
                    mimeType = part.mimeType || 'application/octet-stream';
                }
                if (part.parts) {
                    part.parts.forEach(findAttachment);
                }
            };

            if (message.data.payload) {
                findAttachment(message.data.payload);
            }

            return { data, mimeType, filename };
        } catch (error) {
            console.error('Error downloading attachment:', error);
            return null;
        }
    }

    /**
     * Save attachment to disk
     */
    async saveAttachmentToDisk(
        userId: mongoose.Types.ObjectId,
        gmailMessageId: string,
        attachmentId: string,
        uploadDir: string = 'uploads/attachments'
    ): Promise<string | null> {
        try {
            const attachment = await this.downloadAttachment(userId, gmailMessageId, attachmentId);
            if (!attachment) {
                return null;
            }

            // Create upload directory if it doesn't exist
            const fullUploadDir = path.join(process.cwd(), uploadDir);
            if (!fs.existsSync(fullUploadDir)) {
                fs.mkdirSync(fullUploadDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filepath = path.join(fullUploadDir, `${timestamp}-${sanitizedFilename}`);

            // Save file
            fs.writeFileSync(filepath, attachment.data);

            console.log('✅ Attachment saved:', filepath);
            return filepath;
        } catch (error) {
            console.error('Error saving attachment:', error);
            return null;
        }
    }

    /**
     * Get attachment info without downloading
     */
    async getAttachmentInfo(
        userId: mongoose.Types.ObjectId,
        gmailMessageId: string,
        attachmentId: string
    ): Promise<{ filename: string; mimeType: string; size: number } | null> {
        try {
            const tokenDoc = await GmailToken.findOne({ userId, isActive: true });
            if (!tokenDoc) {
                return null;
            }

            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI;

            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
            oauth2Client.setCredentials({
                access_token: tokenDoc.accessToken,
                refresh_token: tokenDoc.refreshToken
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const message = await gmail.users.messages.get({
                userId: 'me',
                id: gmailMessageId,
                format: 'full'
            });

            let attachmentInfo: any = null;

            const findAttachment = (part: any): void => {
                if (part.body?.attachmentId === attachmentId) {
                    attachmentInfo = {
                        filename: part.filename || 'attachment',
                        mimeType: part.mimeType || 'application/octet-stream',
                        size: part.body.size || 0
                    };
                }
                if (part.parts) {
                    part.parts.forEach(findAttachment);
                }
            };

            if (message.data.payload) {
                findAttachment(message.data.payload);
            }

            return attachmentInfo;
        } catch (error) {
            console.error('Error getting attachment info:', error);
            return null;
        }
    }
}

export const gmailAttachmentService = new GmailAttachmentService();
