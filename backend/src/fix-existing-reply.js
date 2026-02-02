/**
 * Fix existing reply emails that are missing vendorId
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixExistingReplies() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const Email = mongoose.connection.collection('emails');

        // Find all reply emails without vendorId
        const repliesWithoutVendor = await Email.find({
            isReply: true,
            direction: 'inbound',
            vendorId: { $exists: false },
            originalEmailId: { $exists: true }
        }).toArray();

        console.log(`\n📧 Found ${repliesWithoutVendor.length} reply emails without vendorId\n`);

        let fixed = 0;
        for (const reply of repliesWithoutVendor) {
            // Get the original email
            const originalEmail = await Email.findOne({ _id: reply.originalEmailId });

            if (originalEmail && originalEmail.vendorId) {
                // Update the reply with vendorId
                await Email.updateOne(
                    { _id: reply._id },
                    { $set: { vendorId: originalEmail.vendorId } }
                );

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
        console.log('\nNow trigger AI analysis by sending a new reply or using the manual endpoint.');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixExistingReplies();
