
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Email } from './modules/email/model';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

async function resetEmails() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const total = await Email.countDocuments({});
        console.log(`Total emails: ${total}`);

        const outbound = await Email.countDocuments({ direction: 'outbound' });
        console.log(`Outbound emails: ${outbound}`);

        const emails = await Email.find({ direction: 'outbound' });
        console.log(`Found ${emails.length} outbound emails (query).`);

        if (emails.length > 0) {
            const result = await Email.updateMany(
                { direction: 'outbound' },
                { $set: { hasReply: false } }
            );
            console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        }

    } catch (error) {
        console.error('Error resetting emails:', error);
    } finally {
        await mongoose.disconnect();
    }
}

resetEmails();
