// Fix existing inbound emails that are missing vendorId
// Run this script once to update existing data

import mongoose from 'mongoose';
import { Email } from '../modules/email/model';

async function fixInboundEmailVendorIds() {
    try {
        console.log('🔧 Starting to fix inbound email vendorIds...');

        // Find all inbound emails that are replies but don't have vendorId
        const inboundReplies = await Email.find({
            direction: 'inbound',
            isReply: true,
            vendorId: { $exists: false }
        });

        console.log(`📧 Found ${inboundReplies.length} inbound replies without vendorId`);

        let fixed = 0;
        for (const reply of inboundReplies) {
            // Find the original outbound email
            const originalEmail = await Email.findOne({
                _id: reply.originalEmailId
            });

            if (originalEmail && originalEmail.vendorId) {
                // Update the reply with the vendorId from original
                await Email.updateOne(
                    { _id: reply._id },
                    { $set: { vendorId: originalEmail.vendorId } }
                );
                console.log(`✅ Fixed email ${reply._id} - added vendorId: ${originalEmail.vendorId}`);
                fixed++;
            } else {
                console.log(`⚠️  Could not find original email or vendorId for reply ${reply._id}`);
            }
        }

        console.log(`\n✅ Fixed ${fixed} out of ${inboundReplies.length} inbound replies`);
    } catch (error) {
        console.error('❌ Error fixing inbound emails:', error);
    }
}

// Export for use in other scripts
export { fixInboundEmailVendorIds };

// If run directly
if (require.main === module) {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

    mongoose.connect(MONGO_URI)
        .then(async () => {
            console.log('✅ Connected to MongoDB');
            await fixInboundEmailVendorIds();
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        });
}
