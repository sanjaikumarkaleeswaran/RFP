
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { google } = require('googleapis');

// Schemas
const GmailTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    accessToken: String,
    refreshToken: String,
    scope: String,
    tokenType: String,
    expiryDate: Number,
    email: String,
    isActive: Boolean
});
const GmailToken = mongoose.models.GmailToken || mongoose.model('GmailToken', GmailTokenSchema);

const EmailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gmailMessageId: String,
    messageId: String,
    threadId: String,
    subject: String,
    direction: String,
    hasReply: Boolean,
    provider: String,
    deliveryStatus: String,
    processed: Boolean,
    to: [{}],
    from: {},
    createdAt: Date,
    updatedAt: Date
}, { strict: false });
const Email = mongoose.models.Email || mongoose.model('Email', EmailSchema);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

async function sync() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const token = await GmailToken.findOne({ isActive: true });
        if (!token) return;

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        auth.setCredentials({
            access_token: token.accessToken,
            refresh_token: token.refreshToken
        });

        const gmail = google.gmail({ version: 'v1', auth });

        console.log('Fetching sent messages from Gmail...');
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'label:SENT newer_than:2d',
            maxResults: 5
        });
        
        const msgs = res.data.messages || [];
        console.log(`Found ${msgs.length} sent messages.`);

        for (const m of msgs) {
            const d = await gmail.users.messages.get({ userId: 'me', id: m.id });
            const headers = d.data.payload.headers;
            
            const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;
            const subject = getHeader('subject');
            const msgId = getHeader('message-id');
            
            console.log(`Processing: ${subject}`);

            const exists = await Email.findOne({
                $or: [{ gmailMessageId: m.id }, { messageId: msgId }]
            });

            if (exists) {
                console.log('  ⚠️ Exists in DB.');
                console.log('     ID:', exists._id);
                console.log('     hasReply:', exists.hasReply);
                console.log('     messageId:', exists.messageId); 
                console.log('     gmailMessageId:', exists.gmailMessageId);
                console.log('     direction:', exists.direction);
                
                // FIX: Ensure messageId exists if missing
                if (!exists.messageId && msgId) {
                    console.log('     FIXING: Adding messageId...');
                    exists.messageId = msgId;
                    await exists.save();
                }

                // FIX: Ensure hasReply is false
                if (exists.hasReply === true || exists.hasReply === undefined) {
                    console.log('     FIXING: Setting hasReply=false...');
                    exists.hasReply = false;
                    await exists.save();
                }
            } else {
                 console.log('  ✅ Saving to DB...');
                await Email.create({
                    userId: token.userId,
                    gmailMessageId: m.id,
                    messageId: msgId,
                    threadId: m.threadId,
                    subject,
                    direction: 'outbound',
                    hasReply: false,
                    provider: 'gmail',
                    deliveryStatus: 'sent',
                    processed: true,
                    to: [{ email: getHeader('to') }],
                    from: { email: token.email, name: 'Me' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
sync();
