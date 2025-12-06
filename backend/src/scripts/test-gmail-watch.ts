/**
 * Test script to verify Gmail watch service
 * Run this after connecting a Gmail account
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { gmailWatchService } from '../common/services/gmail-watch.service';
import { GmailToken } from '../modules/email/gmail-token.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

async function testGmailWatch() {
    try {
        console.log('🧪 Testing Gmail Watch Service\n');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check for active Gmail tokens
        const activeTokens = await GmailToken.find({ isActive: true });
        console.log(`📊 Active Gmail connections: ${activeTokens.length}`);

        if (activeTokens.length === 0) {
            console.log('\n⚠️  No Gmail accounts connected!');
            console.log('   Please connect a Gmail account first:');
            console.log('   1. Go to http://localhost:5173/emails');
            console.log('   2. Click "Connect Gmail"');
            console.log('   3. Authorize your Gmail account');
            console.log('   4. Run this test again\n');
            process.exit(0);
        }

        // List connected accounts
        console.log('\n📧 Connected Gmail accounts:');
        for (const token of activeTokens) {
            console.log(`   - ${token.email} (User ID: ${token.userId})`);
        }

        // Test manual check for first user
        console.log('\n🔍 Testing manual reply check for first user...');
        const firstUser = activeTokens[0];

        const replies = await gmailWatchService.checkForReplies(firstUser.userId);

        console.log(`\n✅ Check complete!`);
        console.log(`   Found ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`);

        if (replies.length > 0) {
            console.log('\n📬 Replies found:');
            replies.forEach((reply, index) => {
                console.log(`   ${index + 1}. From: ${reply.from}`);
                console.log(`      Subject: ${reply.subject}`);
                console.log(`      Preview: ${reply.bodyPlain?.substring(0, 50)}...`);
            });
        }

        // Test starting watch
        console.log('\n🔍 Starting Gmail watch (30 second interval)...');
        await gmailWatchService.startWatching(firstUser.userId, 30);

        console.log('\n✅ Gmail watch started successfully!');
        console.log('   The service will check for replies every 30 seconds');
        console.log('   Press Ctrl+C to stop\n');

        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n\n⏹️  Stopping Gmail watch...');
            gmailWatchService.stopWatching(firstUser.userId);
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
            process.exit(0);
        });

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

// Run the test
testGmailWatch();
