/**
 * Fix existing reply emails that are missing vendorId
 * This adds vendorId from the original email to all reply emails
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define Email schema inline since we can't import the model directly
const emailSchema = new mongoose.Schema({}, { strict: false });
const Email = mongoose.model('Email', emailSchema);

async function fixExistingReplies() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('✅ Connected to MongoDB');

        // Find all reply emails without vendorId
        const repliesWithoutVendor = await Email.find({
            isReply: true,
            direction: 'inbound',
            vendorId: { $exists: false },
            originalEmailId: { $exists: true }
        });

        console.log(`\n📧 Found ${repliesWithoutVendor.length} reply emails without vendorId\n`);

        let fixed = 0;
        for (const reply of repliesWithoutVendor) {
            // Get the original email
            const originalEmail = await Email.findById(reply.originalEmailId);

            if (originalEmail && originalEmail.vendorId) {
                // Update the reply with vendorId
                await Email.findByIdAndUpdate(reply._id, {
                    vendorId: originalEmail.vendorId
                });

                console.log(`✅ Fixed reply: ${reply.subject}`);
                console.log(`   Reply ID: ${reply._id}`);
                console.log(`   Added vendorId: ${originalEmail.vendorId}`);
                console.log(`   SpaceId: ${reply.spaceId}\n`);
                fixed++;
            } else {
                console.log(`⚠️  Skipped reply: ${reply.subject} (original email has no vendorId)`);
            }
        }

        console.log(`\n✅ Fixed ${fixed} reply emails!`);
        console.log('\nNow you can manually trigger AI analysis on these replies.');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    fixExistingReplies().catch(console.error);
}

export { fixExistingReplies };
