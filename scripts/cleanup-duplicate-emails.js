// Quick script to remove duplicate emails from database
// Run this in MongoDB or via backend API

db.emails.aggregate([
    {
        $group: {
            _id: {
                gmailMessageId: "$gmailMessageId",
                userId: "$userId"
            },
            uniqueIds: { $addToSet: "$_id" },
            count: { $sum: 1 }
        }
    },
    {
        $match: {
            count: { $gt: 1 }
        }
    }
]).forEach(function (doc) {
    // Keep the first one, delete the rest
    doc.uniqueIds.shift(); // Remove first element (keep it)
    db.emails.deleteMany({
        _id: { $in: doc.uniqueIds }
    });
    print("Deleted " + doc.uniqueIds.length + " duplicates for gmailMessageId: " + doc._id.gmailMessageId);
});

print("Duplicate cleanup complete!");
