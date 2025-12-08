/**
 * Simple script to list all emails in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listEmails() {
    try {
        const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!\n');

        const { Email } = await import('../modules/email/model');

        const emails = await Email.find({}).sort({ createdAt: -1 }).limit(10);

        console.log(`Found ${emails.length} recent emails:\n`);

        for (const email of emails) {
            console.log(`ID: ${email._id}`);
            console.log(`Direction: ${email.direction}`);
            console.log(`From: ${email.from.email}`);
            console.log(`Subject: ${email.subject}`);
            console.log(`Vendor ID: ${email.vendorId || 'None'}`);
            console.log(`Space ID: ${email.spaceId || 'None'}`);
            console.log(`Is Reply: ${email.isReply || false}`);
            console.log(`Created: ${email.createdAt}`);
            console.log('---\n');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listEmails();
