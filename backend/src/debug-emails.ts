
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Email } from './modules/email/model';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

async function debugEmails() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const emails = await Email.find({ direction: 'outbound' });

        console.log(`\nFound ${emails.length} outbound emails:\n`);

        emails.forEach((email: any) => {
            console.log('ID:', email._id);
            console.log('Subject:', email.subject);
            console.log('hasReply:', email.hasReply);
            console.log('Processed:', email.processed);
        });

    } catch (error) {
        console.error('Error debugging emails:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugEmails();
