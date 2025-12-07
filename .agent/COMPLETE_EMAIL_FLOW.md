# Complete Email Flow Explanation - How It Works

## Your Question: "Why use thread ID? I want sent mail and reply mail saved correctly in DB and frontend"

Let me explain the **complete flow** from sending an email to receiving a reply and displaying it in the frontend.

---

## 🔄 Complete Email Flow

### Step 1: **User Sends RFP Email to Vendor**

**Frontend Action:**
```typescript
// User clicks "Send RFP" button in the UI
// Frontend calls: POST /api/email/gmail/send

const response = await fetch('/api/email/gmail/send', {
  method: 'POST',
  body: JSON.stringify({
    to: 'vendor@example.com',
    subject: 'RFP - Office Furniture',
    html: '<p>Please send your proposal...</p>',
    spaceId: '6934a140c32af7008153c108'
  })
});
```

**Backend Processing (gmail-api.service.ts - sendEmail method):**
```typescript
async sendEmail(userId, to, subject, text, html, spaceId) {
  // 1. Send email via Gmail API
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage }
  });
  
  // 2. Get the sent message to extract headers
  const sentMessage = await gmail.users.messages.get({
    userId: 'me',
    id: response.data.id,
    format: 'full'
  });
  
  // 3. Extract the ACTUAL Message-ID header (not Gmail's ID)
  const actualMessageId = getHeader('Message-ID'); 
  // Example: "<CABcD123@mail.gmail.com>"
  
  // 4. Check for duplicates BEFORE saving
  const existingEmail = await Email.findOne({
    $or: [
      { gmailMessageId: response.data.id },
      { messageId: actualMessageId }
    ]
  });
  
  if (existingEmail) {
    console.log('⚠️ Email already exists, skipping save');
    return { success: true, messageId: response.data.id };
  }
  
  // 5. Save to database (ONLY ONCE)
  const emailDoc = await Email.create({
    userId,
    spaceId,  // ← Links email to the RFP Space
    from: { email: 'you@gmail.com', name: 'Me' },
    to: [{ email: 'vendor@example.com' }],
    subject: 'RFP - Office Furniture',
    bodyPlain: text,
    bodyHtml: html,
    messageId: actualMessageId,        // ← RFC 2822 Message-ID
    threadId: response.data.threadId,  // ← Gmail Thread ID
    gmailMessageId: response.data.id,  // ← Gmail's internal ID
    direction: 'outbound',             // ← This is a SENT email
    provider: 'gmail',
    deliveryStatus: 'sent',
    processed: true,
    receivedAt: new Date()
  });
  
  console.log('✅ Email saved to database with ID:', emailDoc._id);
  
  return { success: true, messageId: response.data.id };
}
```

**Database After Sending:**
```javascript
{
  _id: ObjectId("674a1b2c3d4e5f6g7h8i9j0k"),
  userId: ObjectId("6934a140c32af7008153c108"),
  spaceId: ObjectId("6934a140c32af7008153c109"),  // ← Links to RFP Space
  from: { email: "you@gmail.com", name: "Me" },
  to: [{ email: "vendor@example.com" }],
  subject: "RFP - Office Furniture",
  messageId: "<CABcD123@mail.gmail.com>",         // ← For matching replies
  threadId: "18d4f5e6a7b8c9d0",                   // ← For finding replies
  gmailMessageId: "18d4f5e6a7b8c9d0",
  direction: "outbound",                           // ← SENT email
  provider: "gmail",
  deliveryStatus: "sent",
  hasReply: false,                                 // ← No reply yet
  createdAt: "2025-12-07T09:00:00Z"
}
```

---

### Step 2: **Vendor Replies to Your Email**

The vendor receives your email and clicks "Reply" in their Gmail. They write their proposal and send it.

**What happens in Gmail:**
- Gmail automatically sets the `In-Reply-To` header to your email's Message-ID
- Gmail keeps the same `threadId` for the conversation
- The reply has its own unique Message-ID

---

### Step 3: **Gmail Watch Service Detects the Reply**

**Background Process (gmail-watch.service.ts - runs every 30 seconds):**

```typescript
async checkForReplies(userId) {
  // 1. Find all sent emails that don't have replies yet
  const sentEmails = await Email.find({
    userId,
    direction: 'outbound',
    hasReply: { $ne: true },
    messageId: { $exists: true, $ne: null }
  });
  
  console.log(`🔍 Found ${sentEmails.length} sent emails waiting for replies`);
  
  // 2. For each sent email, search Gmail for replies
  for (const sentEmail of sentEmails) {
    // Search by thread ID (most reliable way)
    const query = `in:inbox thread:${sentEmail.threadId}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10
    });
    
    const messages = response.data.messages || [];
    
    // 3. Check each message in the thread
    for (const message of messages) {
      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });
      
      const headers = messageData.data.payload.headers;
      const inReplyTo = getHeader('In-Reply-To');
      const messageId = getHeader('Message-ID');
      const gmailMessageId = messageData.data.id;
      
      // 4. COMPREHENSIVE DUPLICATE CHECK
      const existingReply = await Email.findOne({
        $or: [
          { messageId: messageId },           // Check by Message-ID
          { gmailMessageId: gmailMessageId }  // Check by Gmail ID
        ]
      });
      
      if (existingReply) {
        console.log('⚠️ Reply already processed, skipping');
        continue;
      }
      
      // 5. Check if this is a reply to OUR sent email
      const isReplyToOurEmail = 
        inReplyTo === sentEmail.messageId ||  // Message-ID match
        messageData.data.threadId === sentEmail.threadId;  // Thread ID match
      
      if (isReplyToOurEmail) {
        console.log('💬 NEW REPLY DETECTED!');
        
        // 6. Save the reply
        const reply = await this.saveReply(messageData.data, userId, sentEmail);
        
        if (reply) {
          // 7. Mark original email as having a reply
          await Email.findByIdAndUpdate(sentEmail._id, {
            hasReply: true,
            repliedAt: new Date()
          });
          
          console.log(`✅ Reply saved for email: ${sentEmail.subject}`);
        }
      }
    }
  }
}
```

**saveReply Method:**
```typescript
async saveReply(message, userId, originalEmail) {
  // Extract all data from the Gmail message
  const from = getHeader('From');
  const messageId = getHeader('Message-ID');
  const gmailMessageId = message.id;
  const threadId = message.threadId;
  
  // Extract email body
  let bodyPlain = '';
  let bodyHtml = '';
  // ... (extraction logic)
  
  // Extract attachments (PDFs, documents, etc.)
  const attachments = [];
  // ... (extraction logic)
  
  // Extract sender email
  const fromEmail = from?.match(/<(.+)>/)?.[1] || from;
  const fromName = from?.replace(/<.+>/, '').trim();
  
  // Save reply to database
  const replyEmail = await Email.create({
    userId,
    spaceId: originalEmail.spaceId,  // ← Same space as original email!
    from: { email: fromEmail, name: fromName },
    to: [{ email: 'you@gmail.com' }],
    subject: 'Re: RFP - Office Furniture',
    bodyPlain,
    bodyHtml,
    attachments,                      // ← Vendor's proposal PDFs
    messageId,                        // ← Reply's Message-ID
    inReplyTo: originalEmail.messageId,  // ← Links to original
    threadId,                         // ← Same thread as original
    gmailMessageId,
    direction: 'inbound',             // ← This is a RECEIVED email
    provider: 'gmail',
    deliveryStatus: 'delivered',
    receivedAt: new Date(parseInt(message.internalDate)),
    processed: true,
    isReply: true,                    // ← This is a reply
    originalEmailId: originalEmail._id  // ← Links to original email
  });
  
  console.log('✅ Reply saved to database!');
  return replyEmail;
}
```

**Database After Receiving Reply:**

**Original Email (UPDATED):**
```javascript
{
  _id: ObjectId("674a1b2c3d4e5f6g7h8i9j0k"),
  direction: "outbound",
  hasReply: true,        // ← NOW TRUE
  repliedAt: "2025-12-07T09:15:00Z",
  ...
}
```

**New Reply Email:**
```javascript
{
  _id: ObjectId("674a1b2c3d4e5f6g7h8i9j0l"),
  userId: ObjectId("6934a140c32af7008153c108"),
  spaceId: ObjectId("6934a140c32af7008153c109"),  // ← SAME space!
  from: { email: "vendor@example.com", name: "Vendor Name" },
  to: [{ email: "you@gmail.com" }],
  subject: "Re: RFP - Office Furniture",
  bodyPlain: "Thank you for your RFP. Our proposal is attached...",
  attachments: [
    {
      filename: "proposal.pdf",
      mimeType: "application/pdf",
      size: 245678,
      attachmentId: "ANGjdJ8..."
    }
  ],
  messageId: "<CABcD456@mail.gmail.com>",
  inReplyTo: "<CABcD123@mail.gmail.com>",        // ← Links to original
  threadId: "18d4f5e6a7b8c9d0",                   // ← SAME thread
  gmailMessageId: "18d4f5e6a7b8c9d1",
  direction: "inbound",                            // ← RECEIVED email
  provider: "gmail",
  deliveryStatus: "delivered",
  isReply: true,                                   // ← This is a reply
  originalEmailId: ObjectId("674a1b2c3d4e5f6g7h8i9j0k"),  // ← Links back
  receivedAt: "2025-12-07T09:15:00Z",
  createdAt: "2025-12-07T09:15:30Z"
}
```

---

### Step 4: **Frontend Displays the Emails**

**Frontend Query (to get all emails for a space):**
```typescript
// In your React component
const { data: emails } = useQuery({
  queryKey: ['emails', spaceId],
  queryFn: async () => {
    const response = await fetch(`/api/email/sent?spaceId=${spaceId}`);
    return response.json();
  }
});

// emails will contain:
// [
//   { direction: 'outbound', subject: 'RFP - Office Furniture', hasReply: true, ... },
//   { direction: 'inbound', subject: 'Re: RFP - Office Furniture', isReply: true, ... }
// ]
```

**Backend Endpoint (email/controller.ts):**
```typescript
export const getSentEmails = async (req, res) => {
  const userId = req.user.id;
  const { spaceId } = req.query;
  
  const filter = {
    userId: new mongoose.Types.ObjectId(userId),
    direction: 'outbound'  // Get sent emails
  };
  
  if (spaceId) {
    filter.spaceId = new mongoose.Types.ObjectId(spaceId);
  }
  
  const emails = await Email.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);
  
  res.json({ success: true, count: emails.length, emails });
};

export const getReplies = async (req, res) => {
  const userId = req.user.id;
  const { spaceId } = req.query;
  
  const filter = {
    userId: new mongoose.Types.ObjectId(userId),
    direction: 'inbound',  // Get received emails
    isReply: true          // Only replies
  };
  
  if (spaceId) {
    filter.spaceId = new mongoose.Types.ObjectId(spaceId);
  }
  
  const replies = await Email.find(filter)
    .populate('originalEmailId')  // Include original email data
    .sort({ receivedAt: -1 })
    .limit(100);
  
  res.json({ success: true, count: replies.length, replies });
};
```

---

## 🎯 Why We Use Thread ID

**Thread ID is used for:**

1. **Finding Replies in Gmail** - When we search Gmail for replies, we use the thread ID to find all messages in the same conversation
2. **Grouping Related Emails** - All emails in the same conversation have the same thread ID
3. **Backup Matching** - If Message-ID matching fails, we can still match by thread ID

**But the MAIN matching is done by:**
- `inReplyTo` header (contains the original email's Message-ID)
- `originalEmailId` field (direct database link)

---

## 📊 Database Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| `messageId` | RFC 2822 Message-ID header | `<CABcD123@mail.gmail.com>` |
| `gmailMessageId` | Gmail's internal ID | `18d4f5e6a7b8c9d0` |
| `threadId` | Gmail conversation ID | `18d4f5e6a7b8c9d0` |
| `inReplyTo` | Original email's Message-ID | `<CABcD123@mail.gmail.com>` |
| `originalEmailId` | Database link to original | `ObjectId("674a...")` |
| `direction` | `outbound` or `inbound` | `outbound` |
| `isReply` | Is this a reply? | `true` |
| `hasReply` | Does this have a reply? | `true` |
| `spaceId` | Links to RFP Space | `ObjectId("6934...")` |

---

## ✅ How Duplicate Prevention Works

**When Sending:**
```typescript
// Check BEFORE saving
const existingEmail = await Email.findOne({
  $or: [
    { gmailMessageId: response.data.id },
    { messageId: actualMessageId }
  ]
});

if (existingEmail) {
  return { success: true };  // Don't save duplicate
}
```

**When Receiving:**
```typescript
// Check BEFORE saving reply
const existingReply = await Email.findOne({
  $or: [
    { messageId: messageId },           // Check by Message-ID
    { gmailMessageId: gmailMessageId }, // Check by Gmail ID
    {                                   // Check by combination
      threadId: threadId,
      receivedAt: receivedDate,
      'from.email': fromEmail
    }
  ]
});

if (existingReply) {
  return null;  // Don't save duplicate
}
```

---

## 🎨 Frontend Display Example

```typescript
function EmailList({ spaceId }) {
  const { data: sentEmails } = useQuery(['sent-emails', spaceId], 
    () => fetch(`/api/email/sent?spaceId=${spaceId}`).then(r => r.json())
  );
  
  const { data: replies } = useQuery(['replies', spaceId],
    () => fetch(`/api/email/replies?spaceId=${spaceId}`).then(r => r.json())
  );
  
  return (
    <div>
      <h2>Sent RFPs</h2>
      {sentEmails?.emails.map(email => (
        <div key={email.id}>
          <p>To: {email.to[0].email}</p>
          <p>Subject: {email.subject}</p>
          <p>Status: {email.hasReply ? '✅ Replied' : '⏳ Waiting'}</p>
        </div>
      ))}
      
      <h2>Vendor Replies</h2>
      {replies?.replies.map(reply => (
        <div key={reply.id}>
          <p>From: {reply.from.email}</p>
          <p>Subject: {reply.subject}</p>
          <p>Attachments: {reply.attachments?.length || 0}</p>
          <button onClick={() => viewAttachment(reply.attachments[0])}>
            View Proposal
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔑 Key Points

1. **Thread ID is for FINDING replies in Gmail** - not for database storage
2. **Message-ID is for MATCHING replies** - this is the main link
3. **originalEmailId is for DATABASE linking** - direct reference
4. **spaceId links everything to the RFP** - both sent and received emails
5. **direction field separates sent vs received** - `outbound` vs `inbound`
6. **Duplicate checking happens BEFORE saving** - prevents multiple saves
7. **Gmail Watch runs every 30 seconds** - automatically detects new replies

---

## ✅ Summary

**Your emails are saved correctly because:**
1. ✅ Each sent email is saved ONCE with `direction: 'outbound'`
2. ✅ Each reply is saved ONCE with `direction: 'inbound'` and `isReply: true`
3. ✅ Both are linked to the same `spaceId`
4. ✅ Replies are linked to original via `originalEmailId` and `inReplyTo`
5. ✅ Duplicate checking prevents multiple saves
6. ✅ Frontend can query by `spaceId` and `direction` to show correct emails

**The thread ID is just a helper for finding emails in Gmail, not the main storage mechanism!**
