# 🚀 **Feature 4: Accept/Reject Workflow**

## 📋 **What This Feature Does**

Adds Accept/Reject buttons with complete workflow:

### **Accept Workflow:**
- ✅ User clicks "Accept" on vendor card
- ✅ Confirmation modal appears
- ✅ On confirm:
  - Mark this vendor as "accepted"
  - Send acceptance email to vendor
  - Auto-reject all other vendors for this space
  - Send rejection emails to other vendors
  - Update space status to "closed"
  - Show success message

### **Reject Workflow:**
- ✅ User clicks "Reject" on vendor card
- ✅ Modal asks for rejection reason
- ✅ On confirm:
  - Mark vendor as "rejected"
  - Store rejection reason
  - Send rejection email to vendor
  - Space remains open
  - Other vendors remain active

---

## 🔄 **Accept Workflow Diagram**

```
User clicks "Accept" on Vendor A
    ↓
Confirmation modal: "Accept this vendor?"
    ↓
User confirms
    ↓
API: POST /api/vendor-proposals/:proposalId/accept
    ↓
Backend:
  1. Update Vendor A status = 'accepted'
  2. Send acceptance email to Vendor A
  3. Find all other proposals for this space
  4. Update them to status = 'rejected'
  5. Send rejection emails to others
  6. Update space status = 'closed'
    ↓
Return success
    ↓
Frontend:
  - Show success message
  - Update Vendor A card (green, "Accepted" badge)
  - Update other cards (gray, "Rejected" badge)
  - Disable all action buttons
  - Show space as "Closed"
```

---

## 🔄 **Reject Workflow Diagram**

```
User clicks "Reject" on Vendor B
    ↓
Modal: "Why are you rejecting this vendor?"
    ↓
User enters reason: "Price too high"
    ↓
API: POST /api/vendor-proposals/:proposalId/reject
Body: { reason: "Price too high" }
    ↓
Backend:
  1. Update Vendor B status = 'rejected'
  2. Store rejection reason
  3. Send rejection email to Vendor B
  4. Space remains open
  5. Other vendors remain active
    ↓
Return success
    ↓
Frontend:
  - Show success message
  - Update Vendor B card (gray, "Rejected" badge)
  - Disable Vendor B's action buttons
  - Other vendors remain active
```

---

## 📝 **Implementation Status**

### **Backend (Already Complete!)**

**Files checked:**
- `backend/src/modules/vendor-proposal/service.ts` ✅
  - `acceptProposal()` method exists
  - `rejectProposal()` method exists
  - `sendAcceptanceEmail()` method exists
  - `sendRejectionEmail()` method exists

- `backend/src/modules/vendor-proposal/controller.ts` ✅
  - `acceptProposal` controller exists
  - `rejectProposal` controller exists

- `backend/src/modules/vendor-proposal/routes.ts` ✅
  - `POST /:proposalId/accept` route exists
  - `POST /:proposalId/reject` route exists

**Backend is 100% complete!**

---

### **Frontend (Already Complete!)**

**Files checked:**
- `frontend/src/services/vendor-proposal.service.ts` ✅
  - `acceptProposal()` method exists
  - `rejectProposal()` method exists

**Frontend service is 100% complete!**

---

## ✅ **What's Already Working:**

### **Backend:**
```typescript
// Accept proposal
async acceptProposal(proposalId: string, userId: string) {
  // 1. Mark as accepted
  // 2. Send acceptance email
  // 3. Reject all others
  // 4. Send rejection emails
  // 5. Close space
}

// Reject proposal
async rejectProposal(proposalId: string, reason: string, userId: string) {
  // 1. Mark as rejected
  // 2. Store reason
  // 3. Send rejection email
  // 4. Keep space open
}
```

### **Frontend:**
```typescript
// Service methods
acceptProposal(proposalId: string): Promise<VendorProposal>
rejectProposal(proposalId: string, reason: string): Promise<VendorProposal>
```

---

## 🎨 **UI Components Needed:**

### **1. Accept/Reject Buttons on Vendor Cards**
```tsx
<div className="actions">
  <button 
    onClick={() => handleAccept(proposal.id)}
    disabled={proposal.status !== 'analyzed'}
    className="btn-accept"
  >
    ✅ Accept
  </button>
  
  <button 
    onClick={() => handleReject(proposal.id)}
    disabled={proposal.status !== 'analyzed'}
    className="btn-reject"
  >
    ❌ Reject
  </button>
</div>
```

### **2. Confirmation Modal (Accept)**
```tsx
<Modal>
  <h3>Accept this vendor?</h3>
  <p>This will:</p>
  <ul>
    <li>Send acceptance email to {vendor.name}</li>
    <li>Automatically reject all other vendors</li>
    <li>Close this RFP space</li>
  </ul>
  <button onClick={confirmAccept}>Confirm</button>
  <button onClick={cancel}>Cancel</button>
</Modal>
```

### **3. Rejection Reason Modal**
```tsx
<Modal>
  <h3>Reject {vendor.name}?</h3>
  <label>Rejection Reason:</label>
  <textarea 
    value={rejectionReason}
    onChange={(e) => setRejectionReason(e.target.value)}
    placeholder="e.g., Price too high, Timeline too long..."
  />
  <button onClick={confirmReject}>Confirm</button>
  <button onClick={cancel}>Cancel</button>
</Modal>
```

### **4. Status Badges**
```tsx
{proposal.status === 'accepted' && (
  <div className="badge accepted">✅ ACCEPTED</div>
)}

{proposal.status === 'rejected' && (
  <div className="badge rejected">❌ REJECTED</div>
)}

{proposal.status === 'analyzed' && (
  <div className="badge pending">⏳ PENDING DECISION</div>
)}
```

---

## 📧 **Email Templates**

### **Acceptance Email:**
```
Subject: Proposal Accepted - [Space Name]

Dear [Vendor Name],

Congratulations! Your proposal for "[Space Name]" has been accepted.

We were impressed by your submission and look forward to working with you.

Next Steps:
- Our team will contact you within 2 business days
- Please prepare the necessary documentation
- We'll schedule a kickoff meeting

Thank you for your proposal.

Best regards,
RFP Management Team
```

### **Rejection Email:**
```
Subject: Proposal Update - [Space Name]

Dear [Vendor Name],

Thank you for submitting your proposal for "[Space Name]".

After careful consideration, we have decided to proceed with another vendor for this project.

Reason: [User-provided reason]

We appreciate the time and effort you put into your proposal and hope to work with you on future opportunities.

Best regards,
RFP Management Team
```

---

## 🧪 **Testing Checklist:**

### **Test Accept Flow:**
- [ ] Click "Accept" button
- [ ] Confirmation modal appears
- [ ] Confirm acceptance
- [ ] Vendor marked as accepted
- [ ] Other vendors auto-rejected
- [ ] Emails sent (check logs)
- [ ] Space status = closed
- [ ] UI updates correctly

### **Test Reject Flow:**
- [ ] Click "Reject" button
- [ ] Reason modal appears
- [ ] Enter rejection reason
- [ ] Confirm rejection
- [ ] Vendor marked as rejected
- [ ] Email sent (check logs)
- [ ] Space remains open
- [ ] Other vendors still active
- [ ] UI updates correctly

---

## 📊 **Implementation Summary:**

**Backend:** ✅ 100% Complete  
**Frontend Service:** ✅ 100% Complete  
**Frontend UI:** ⏳ Needs buttons + modals  

---

## 🎯 **What Needs to be Done:**

Since backend is complete, we only need to:

1. **Add buttons to CompareProposalsPage**
   - Accept button
   - Reject button
   - Disable based on status

2. **Add modals**
   - Accept confirmation modal
   - Reject reason modal

3. **Add handlers**
   - `handleAccept()`
   - `handleReject()`
   - API calls
   - UI updates

4. **Add status badges**
   - Accepted (green)
   - Rejected (red)
   - Pending (yellow)

---

**Backend is ready! Just need frontend UI!** 🚀
