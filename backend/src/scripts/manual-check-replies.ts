/**
 * Manual script to check for vendor replies and trigger analysis
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { gmailWatchService } from '../common/services/gmail-watch.service';
import { GmailToken } from '../modules/email/gmail-token.model';
import { Email } from '../modules/email/model';
import { vendorProposalService } from '../modules/vendor-proposal/service';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

async function manualCheckAndAnalyze() {
    try {
        console.log('🔍 Manual Vendor Reply Check & Analysis\n');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check for active Gmail tokens
        const activeTokens = await GmailToken.find({ isActive: true });
        console.log(`📊 Active Gmail connections: ${activeTokens.length}\n`);

        if (activeTokens.length === 0) {
            console.log('⚠️  No Gmail accounts connected!');
            process.exit(0);
        }

        // List connected accounts
        console.log('📧 Connected Gmail accounts:');
        for (const token of activeTokens) {
            console.log(`   - ${token.email} (User ID: ${token.userId})`);
        }

        // Check for replies for first user
        console.log('\n🔍 Checking for vendor replies...\n');
        const firstUser = activeTokens[0];

        const replies = await gmailWatchService.checkForReplies(firstUser.userId);

        console.log(`\n✅ Check complete!`);
        console.log(`   Found ${replies.length} new ${replies.length === 1 ? 'reply' : 'replies'}\n`);

        if (replies.length > 0) {
            console.log('📬 New replies found and processed!\n');
        }

        // Now check for any inbound emails that have vendorId and spaceId but haven't been analyzed
        console.log('🔍 Checking for unanalyzed vendor replies in database...\n');

        const unanalyzedReplies = await Email.find({
            direction: 'inbound',
            vendorId: { $exists: true, $ne: null },
            spaceId: { $exists: true, $ne: null },
            isReply: true
        }).populate('vendorId spaceId');

        console.log(`📊 Found ${unanalyzedReplies.length} vendor replies in database\n`);

        if (unanalyzedReplies.length > 0) {
            console.log('📧 Vendor replies:');
            for (const reply of unanalyzedReplies) {
                console.log(`\n   Reply ID: ${reply._id}`);
                console.log(`   From: ${reply.from.email}`);
                console.log(`   Subject: ${reply.subject}`);
                console.log(`   Vendor: ${(reply as any).vendorId?.name || 'Unknown'}`);
                console.log(`   Space: ${(reply as any).spaceId?.name || 'Unknown'}`);
                console.log(`   Received: ${reply.receivedAt}`);

                // Check if already analyzed
                const { VendorProposal } = await import('../modules/vendor-proposal/model');
                const existingProposal = await VendorProposal.findOne({
                    emailId: reply._id
                });

                if (existingProposal) {
                    console.log(`   ✅ Already analyzed (Proposal ID: ${existingProposal._id})`);
                    console.log(`   Score: ${existingProposal.overallScore}`);
                    console.log(`   Status: ${existingProposal.status}`);
                } else {
                    console.log(`   ⚠️  NOT YET ANALYZED - Analyzing now...`);
                    try {
                        const proposal = await vendorProposalService.analyzeVendorReply(reply._id.toString());
                        console.log(`   ✅ Analysis complete!`);
                        console.log(`   Proposal ID: ${proposal.id}`);
                        console.log(`   Score: ${proposal.overallScore}`);
                        console.log(`   Personal Feedback: ${proposal.personalFeedback?.substring(0, 100)}...`);
                        console.log(`   Status: ${proposal.status}`);
                    } catch (error) {
                        console.error(`   ❌ Analysis failed:`, error);
                    }
                }
            }
        }

        console.log('\n✅ Manual check complete!\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the check
manualCheckAndAnalyze();
