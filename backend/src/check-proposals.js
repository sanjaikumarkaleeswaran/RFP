
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const VendorProposalSchema = new mongoose.Schema({
    spaceId: mongoose.Schema.Types.ObjectId,
    vendorId: mongoose.Schema.Types.ObjectId,
    overallScore: Number,
    personalFeedback: String,
    status: String
}, { strict: false });
const VendorProposal = mongoose.models.VendorProposal || mongoose.model('VendorProposal', VendorProposalSchema);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova';

async function check() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const count = await VendorProposal.countDocuments({});
        console.log(`Total Proposals: ${count}`);

        const proposals = await VendorProposal.find({}).sort({ _id: -1 });
        proposals.forEach(p => {
            console.log(`Propsal: ${p._id}`);
            console.log(`  Status: ${p.status}`);
            console.log(`  Score: ${p.overallScore}`);
            console.log(`  Feedback: ${p.personalFeedback ? p.personalFeedback.substring(0, 50) + '...' : 'None'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
check();
