
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import { GmailToken } from './modules/email/gmail-token.model';
import { Email } from './modules/email/model';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

async function syncSentEmails() {
    try {
        console.log('Connecting to DB:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find the user with active Gmail token
        const tokenDoc = await GmailToken.findOne({ isActive: true });

        if (!tokenDoc) {
            console.error('❌ No active Gmail token found. Please login via UI first.');
            return;
        }

        console.log(`Using Gmail Token for User ID: ${tokenDoc.userId}`);
        const userId = tokenDoc.userId;

        // Create OAuth client
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

        // List SENT messages from last 2 days
        console.log('🔍 Fetching sent emails from Gmail (last 2 days)...');
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'label:SENT newer_than:2d',
            maxResults: 20
        });

        const messages = res.data.messages || [];
        console.log(`Found ${messages.length} sent messages.`);

        for (const msg of messages) {
            const messageData = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
                format: 'full'
            });

            const headers = messageData.data.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

            const subject = getHeader('subject');
            const messageId = getHeader('message-id');
            const to = getHeader('to');
            const threadId = msg.threadId;
            const gmailMessageId = msg.id;

            console.log(`Processing: ${subject} (${messageId})`);

            // Check if exists
            const existing = await Email.findOne({
                $or: [
                    { gmailMessageId: gmailMessageId },
                    { messageId: messageId }
                ]
            });

            if (existing) {
                console.log('  ⚠️ Already exists in DB. Skipping.');
                // Ensure hasReply is false if we want to re-check?
                // existing.hasReply = false; 
                // await existing.save();
                continue;
            }

            // Save new
            console.log('  ✅ Saving to DB...');
            await Email.create({
                userId,
                from: { email: tokenDoc.email || 'me', name: 'Me' },
                to: [{ email: to || '', name: '' }],
                subject: subject,
                bodyPlain: 'Imported via sync script',
                direction: 'outbound',
                provider: 'gmail',
                deliveryStatus: 'sent',
                processed: true,
                messageId: messageId,
                gmailMessageId: gmailMessageId,
                threadId: threadId,
                hasReply: false,
                isReply: false,
                createdAt: new Date(),
                updatedAt: new Date()
            } as any);
        }

    } catch (error) {
        console.error('Error syncing emails:', error);
    } finally {
        await mongoose.disconnect();
    }
}

syncSentEmails();
