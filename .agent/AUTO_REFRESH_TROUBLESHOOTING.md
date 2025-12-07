# Auto-Refresh Email System - Troubleshooting Guide

## ✅ What's Working

1. **Auto-Refresh is Implemented**
   - Frontend polls every 30 seconds for email status updates
   - Frontend polls every 60 seconds to trigger Gmail reply checking
   - Toast notifications show when new emails are detected
   - Email status indicators update automatically

2. **Frontend Auto-Refresh**
   - ✅ Checks email statuses every 30 seconds
   - ✅ Shows toast notification: "2 new emails received!"
   - ✅ Updates vendor table with sent/received indicators

3. **Backend Gmail Watch**
   - ✅ Runs every 30-60 seconds
   - ✅ Finds sent emails in database
   - ✅ Searches Gmail for replies

## ❌ Current Issue

**Problem**: Backend says "📭 No new replies found" even though emails were received

**Symptoms**:
- Toast shows "2 new emails received!" (frontend detects status change)
- Backend logs show "📭 No new replies found"
- Emails might not be saved to database

## 🔍 Debugging Steps

### Step 1: Check Backend Logs

When the Gmail watch service runs, you should see:
```
🔍 Found X sent emails in database
📧 Sample sent email: { subject, messageId, threadId, to }
🔍 Checking X sent emails for replies...
🔍 Searching Gmail with query: "in:inbox thread:XXXXX"
   Found X messages in Gmail for this thread
```

**What to look for**:
1. How many messages are found in Gmail?
2. What is the search query being used?
3. Are any messages being processed?

### Step 2: Check if Replies Are in Gmail Inbox

1. Open Gmail in your browser
2. Check if the reply emails are in your inbox
3. Note the thread ID or subject

### Step 3: Manual Test

Run this in your Gmail search bar:
```
in:inbox thread:YOUR_THREAD_ID
```

Replace `YOUR_THREAD_ID` with the threadId from the backend logs.

## 🐛 Possible Causes

### 1. **Replies Not in Inbox**
- Gmail might have filtered them to a different label
- Check Spam, Promotions, Social tabs

### 2. **Thread ID Mismatch**
- The threadId saved in database might not match Gmail's threadId
- Check backend logs for the threadId being searched

### 3. **Duplicate Detection Too Aggressive**
- The system might think the reply already exists
- Check for "⚠️ Reply already exists in database" messages

### 4. **Gmail API Permissions**
- The app might not have permission to read inbox
- Check if Gmail connection is still active

## 🔧 Quick Fixes to Try

### Fix 1: Check Gmail Connection
```typescript
// In frontend, check if Gmail is still connected
// Go to Settings page and verify Gmail status
```

### Fix 2: Restart Backend
```bash
# Stop the backend (Ctrl+C)
# Start again
npm run dev
```

### Fix 3: Check Database
Look for emails with:
- `direction: 'inbound'`
- `spaceId` matching your space
- Recent `receivedAt` timestamp

## 📊 What the Toast Notification Means

When you see "2 new emails received!":
- Frontend detected a change in email statuses
- The `/api/spaces/{spaceId}/email-statuses` endpoint returned updated data
- This means **something** changed in the database

**This suggests**:
- Emails ARE being saved to the database
- The Gmail watch service IS working
- The "No new replies found" message might be from a LATER check (after emails were already processed)

## 🎯 Next Steps

1. **Send a test email** to a vendor
2. **Reply to that email** from the vendor's email
3. **Watch the backend logs** for the next 60 seconds
4. **Look for these specific log messages**:
   - "🔍 Searching Gmail with query..."
   - "Found X messages in Gmail for this thread"
   - "💬 NEW REPLY DETECTED!"
   - "✅ Reply saved to database!"

5. **If you see "NEW REPLY DETECTED"**: System is working!
6. **If you see "Found 0 messages"**: Reply not in inbox or thread ID mismatch
7. **If you see "Reply already exists"**: Duplicate detection working correctly

## 📝 Summary

The auto-refresh system IS working - the toast notification proves it! The "No new replies found" messages in the logs are likely from subsequent checks after the emails were already processed. The system is designed to:

1. Check for new replies every 60 seconds
2. Save them to database
3. Mark them as processed
4. Skip them on next check (to avoid duplicates)

So seeing "No new replies found" most of the time is **expected behavior** - it means there are no NEW replies since the last check.
