
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
    subject: String,
    direction: String,
    from: {},
    receivedAt: Date
}, { strict: false });
const Email = mongoose.models.Email || mongoose.model('Email', EmailSchema);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

async function findReply() {
    try {
        await mongoose.connect(MONGO_URI);

        const replies = await Email.find({
            subject: /Re: RFP/,
            direction: 'inbound'
        });

        console.log(`Found ${replies.length} inbound replies.`);
        replies.forEach(r => {
            console.log(`ID: ${r._id}, Subject: ${r.subject}, From: ${JSON.stringify(r.from)}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
findReply();
