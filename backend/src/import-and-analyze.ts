
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import { GmailToken } from './modules/email/gmail-token.model';
import { Email } from './modules/email/model';
import { Vendor } from './modules/vendor/model';
import { vendorProposalService } from './modules/vendor-proposal/service';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

async function importAndAnalyze() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        // 1. Get Token
        const tokenDoc = await GmailToken.findOne({ isActive: true });
        if (!tokenDoc) {
            console.error('No active token');
            return;
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        auth.setCredentials({
            access_token: tokenDoc.accessToken,
            refresh_token: tokenDoc.refreshToken
        });

        const gmail = google.gmail({ version: 'v1', auth });

        // 2. Search for the reply
        console.log('Searching for reply in Gmail...');
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:"Re: RFP" in:inbox',
            maxResults: 5
        });

        const messages = res.data.messages || [];
        console.log(`Found ${messages.length} replies in Gmail.`);

        for (const msg of messages) {
            // Check if exists
            let emailDoc = await Email.findOne({ gmailMessageId: msg.id });

            if (emailDoc) {
                console.log(`Email ${msg.id} already in DB. Checking metadata...`);
            } else {
                console.log(`Importing Email ${msg.id}...`);
                const d = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
                const headers = d.data.payload?.headers || [];
                const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

                const from = getHeader('from') || '';
                const subject = getHeader('subject') || '';
                const messageId = getHeader('message-id');
                const inReplyTo = getHeader('in-reply-to');
                const threadId = msg.threadId;

                // Extract body simple
                let bodyPlain = '';
                const parts = d.data.payload?.parts || [];
                // (Simplified body extraction for brevity, assuming text/plain exists or snippet)
                bodyPlain = d.data.snippet || 'Body content';

                emailDoc = await Email.create({
                    userId: tokenDoc.userId,
                    gmailMessageId: msg.id,
                    messageId,
                    threadId,
                    inReplyTo,
                    subject,
                    from: { email: from.match(/<(.+)>/)?.[1] || from, name: from.replace(/<.+>/, '').trim() },
                    to: [{ email: 'me' }], // Simplified
                    bodyPlain,
                    direction: 'inbound',
                    isReply: true,
                    provider: 'gmail',
                    deliveryStatus: 'received',
                    receivedAt: new Date(parseInt(d.data.internalDate || Date.now().toString())),
                    processed: true
                } as any);
                console.log(`✅ Created Email doc: ${emailDoc._id}`);
            }

            // 3. Link Vendor and Space
            let needsSave = false;

            // Link Space logic
            if (!emailDoc.spaceId) {
                // Find original email by ThreadID preferably
                const original = await Email.findOne({
                    threadId: emailDoc.threadId,
                    direction: 'outbound'
                });

                if (original && original.spaceId) {
                    console.log(`Found Space ID from original email: ${original.spaceId}`);
                    emailDoc.spaceId = original.spaceId;
                    needsSave = true;
                } else {
                    console.warn(`⚠️ Could not find original email/space for thread ${emailDoc.threadId}`);
                }
            }

            // Link Vendor logic
            if (!emailDoc.vendorId) {
                const fromEmail = emailDoc.from.email;
                const vendor = await Vendor.findOne({
                    $or: [{ email: fromEmail }, { emails: fromEmail }]
                });

                if (vendor) {
                    console.log(`Found Vendor: ${vendor.name} (${vendor._id})`);
                    emailDoc.vendorId = vendor._id as any;
                    needsSave = true;
                } else {
                    console.warn(`⚠️ Could not find vendor for email ${fromEmail}`);
                }
            }

            if (needsSave) {
                await emailDoc.save();
                console.log('Updated Email metadata.');
            }

            // 4. Analyze
            if (emailDoc.spaceId && emailDoc.vendorId) {
                console.log('🚀 Triggering AI Analysis...');
                try {
                    const proposal = await vendorProposalService.analyzeVendorReply(emailDoc._id.toString());
                    console.log('✅ Analysis Complete!');
                    console.log(`   Proposal ID: ${proposal.id}`);
                    console.log(`   Score: ${proposal.overallScore}`);
                } catch (err) {
                    // Check if it's "Proposal already exists" error? 
                    // analyzeVendorReply updates existing, so it shouldn't error.
                    console.error('❌ Analysis failed:', err);
                }
            } else {
                console.log('Skipping analysis due to missing Space or Vendor ID.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

importAndAnalyze();
