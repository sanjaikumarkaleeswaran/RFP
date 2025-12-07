# Testing Guide - Email Send & Receive Fixes

## Quick Test Steps

### 1. Test Sending Emails (No Duplicates)

**Steps:**
1. Go to your RFP application
2. Create or open a Space
3. Send an RFP to a vendor
4. **Check the backend console logs** - you should see:
   ```
   📧 Sending email via Gmail API...
   ✅ Email sent via Gmail API to: vendor@example.com
      Gmail Message ID: 18d4f5e6a7b8c9d0
      Thread ID: 18d4f5e6a7b8c9d0
      Message-ID Header: <CABcD123@mail.gmail.com>
   ✅ Email saved to database with ID: 674a1b2c3d4e5f6g7h8i9j0k
   ```

5. **Try sending the same email again** (if possible) - you should see:
   ```
   ⚠️  Email already exists in database, skipping save
   ```

**Expected Result:**
- Only ONE email record in the database
- The `messageId` field should contain the Message-ID header (e.g., `<CABcD123@mail.gmail.com>`)
- The `gmailMessageId` field should contain Gmail's internal ID (e.g., `18d4f5e6a7b8c9d0`)

---

### 2. Test Receiving Emails (No Duplicates)

**Steps:**
1. Send an RFP to a vendor (or use a test email account)
2. Reply to that email from the vendor's email account
3. Wait 30 seconds (the Gmail watch service checks every 30 seconds)
4. **Check the backend console logs** - you should see:
   ```
   🔍 Checking 1 sent emails for replies...
   💬 NEW REPLY DETECTED!
   📧 Processing reply...
      Gmail Message ID: 18d4f5e6a7b8c9d1
      Message-ID Header: <CABcD456@mail.gmail.com>
      Thread ID: 18d4f5e6a7b8c9d0
      From: Vendor Name <vendor@example.com>
   ✅ Reply saved to database!
     Reply ID: 674a1b2c3d4e5f6g7h8i9j0l
   ✅ Found and saved 1 new reply
   ```

5. **Wait another 30 seconds** - the watch service will run again, and you should see:
   ```
   ⚠️  Reply already processed (Email ID: 674a1b2c3d4e5f6g7h8i9j0l)
   📭 No new replies found
   ```

**Expected Result:**
- Only ONE inbound email record in the database
- The reply is linked to the original email via `originalEmailId`
- The original email has `hasReply: true`

---

### 3. Test Attachments

**Steps:**
1. Have a vendor reply with a PDF attachment (or use a test email)
2. Wait for the Gmail watch service to detect the reply
3. **Check the backend console logs** - you should see:
   ```
   📧 Reply Details:
     From: vendor@example.com
     Subject: Re: RFP - Office Furniture
     Thread ID: 18d4f5e6a7b8c9d0
     In-Reply-To: <CABcD123@mail.gmail.com>
     Attachments: 1
     Body Preview: Thank you for your RFP. Please find our proposal attached...
   ```

4. Check the database - the email record should have an `attachments` array:
   ```json
   {
     "attachments": [
       {
         "filename": "proposal.pdf",
         "mimeType": "application/pdf",
         "size": 245678,
         "attachmentId": "ANGjdJ8...",
         "storagePath": "",
         "inline": false
       }
     ]
   }
   ```

**Expected Result:**
- Attachments are properly extracted and stored
- You can see the attachment count in the logs
- The attachment metadata is saved in the database

---

### 4. Manual Duplicate Test

**Steps:**
1. Open MongoDB Compass or your database viewer
2. Find the `emails` collection
3. Note the current count of emails
4. Manually trigger the Gmail watch service by calling the API:
   ```bash
   POST http://localhost:5000/api/email/gmail/watch/check
   ```
5. Call it again 2-3 times
6. Check the database - the email count should NOT increase

**Expected Result:**
- No duplicate emails are created
- Console shows "⚠️  Reply already processed" messages

---

## Database Verification

### Check Email Records

Use MongoDB Compass or run this query:

```javascript
// Find all outbound emails (sent by you)
db.emails.find({ 
  direction: 'outbound',
  provider: 'gmail'
}).sort({ createdAt: -1 }).limit(5)

// Find all inbound emails (replies from vendors)
db.emails.find({ 
  direction: 'inbound',
  provider: 'gmail',
  isReply: true
}).sort({ receivedAt: -1 }).limit(5)

// Check for duplicates (should return empty array)
db.emails.aggregate([
  {
    $group: {
      _id: "$gmailMessageId",
      count: { $sum: 1 },
      emails: { $push: "$_id" }
    }
  },
  {
    $match: {
      count: { $gt: 1 }
    }
  }
])
```

---

## Troubleshooting

### If emails are still duplicating:

1. **Check the console logs** - look for the duplicate detection messages
2. **Verify the messageId field** - it should contain the Message-ID header, not Gmail's ID
3. **Check the database indexes** - ensure `messageId` has a unique sparse index
4. **Restart the server** - sometimes hot reload doesn't pick up all changes

### If replies are not being detected:

1. **Check Gmail watch is running** - look for "🔍 Starting Gmail watch" in console
2. **Verify Gmail connection** - ensure the user has connected their Gmail account
3. **Check the threadId** - replies should have the same threadId as the original email
4. **Look for errors** - check console for any error messages

### If attachments are missing:

1. **Check the email source** - ensure the email actually has attachments
2. **Look for attachment extraction logs** - should show "Attachments: X"
3. **Verify the MIME type** - some inline images might not be counted as attachments

---

## Success Criteria

✅ **Sending emails**: Only one database record per sent email  
✅ **Receiving emails**: Only one database record per received email  
✅ **Attachments**: Properly extracted and stored with metadata  
✅ **Threading**: Replies correctly linked to original emails  
✅ **Logging**: Clear console messages for debugging  

---

## Next Steps

After verifying these fixes work:

1. **Test with real vendors** - send actual RFPs and wait for real responses
2. **Monitor the database** - check for any duplicates over time
3. **Review attachment downloads** - implement the attachment download feature if needed
4. **Set up email notifications** - notify users when replies are received

---

## Notes

- The Gmail watch service runs every 30 seconds by default
- You can manually trigger it via the API endpoint
- All changes are backward compatible with existing emails
- The server automatically reloaded with the new code (hot reload)
