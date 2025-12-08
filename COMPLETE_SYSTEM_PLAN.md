# 🎯 **Complete Vendor Proposal System - Implementation Plan**

## 📊 **System Flow**

### **1. Automatic Vendor Reply Analysis** 🤖
**Trigger:** When vendor replies to RFP email

**Process:**
1. Email received via Gmail Watch
2. Detect it's a vendor reply (in thread)
3. Fetch space structured data
4. Analyze reply against space requirements
5. Generate personalized feedback for THIS vendor
6. Store/Update vendor proposal in database
7. If attachments exist → Analyze them
8. Update proposal every time vendor replies in thread

**Output:**
- Vendor-specific feedback
- Score based on space requirements
- Extracted data (pricing, timeline, etc.)
- Attachment analysis (if any)

---

### **2. Compare Proposals Screen** 📊
**Trigger:** User navigates to `/spaces/:spaceId/compare`

**Display:**
- List all vendor proposals for this space
- Show each vendor's:
  - Latest feedback
  - Score
  - Key extracted data
  - Attachment summaries
- Side-by-side comparison
- **NO AI recommendations yet** (only on "Get Results" click)

---

### **3. Attachment Analysis** 📎
**Trigger:** Vendor reply contains attachments

**Process:**
1. Detect attachment type (PDF/Image)
2. **PDF:**
   - Fetch from Gmail API
   - Extract text with pdf-parse
   - Analyze with Mistral 3
3. **Image:**
   - Fetch from Gmail API
   - Analyze with HF Vision models
   - Extract text/captions
   - Analyze with Mistral 3
4. Store analysis in proposal

---

### **4. AI Recommendations (Results Button)** 🏆
**Trigger:** User clicks "Get AI Recommendations" button

**Process:**
1. Fetch all proposals for space
2. Fetch space structured data
3. Send to Mistral 3 for comparison
4. AI analyzes:
   - Which vendor is BEST and WHY
   - Why to REJECT others
   - Detailed reasoning
5. Generate visual representation:
   - Winner highlighted
   - Pros/Cons for each
   - Clear rejection reasons

**Output:**
- Best vendor recommendation
- Detailed reasoning
- Rejection reasons for others
- Visual ranking

---

### **5. Accept/Reject Vendors** ✅❌
**Trigger:** User clicks Accept/Reject button

**Accept Flow:**
1. Mark vendor as "accepted"
2. Send acceptance email to vendor
3. Auto-reject all other vendors
4. Send rejection emails to others
5. Update space status to "closed"
6. Show "Vendor Accepted" badge on space

**Reject Flow:**
1. Mark vendor as "rejected"
2. User provides rejection reason
3. Send rejection email to vendor
4. Space remains open
5. Other vendors still active

---

## 🗄️ **Database Schema**

### **VendorProposal Model:**
```typescript
{
  spaceId: ObjectId,
  vendorId: ObjectId,
  emailId: ObjectId,  // Latest reply
  
  // Personal Feedback (updated each reply)
  personalFeedback: String,
  score: Number,  // 0-100
  
  // Extracted Data
  extractedData: {
    pricing: { total, currency, breakdown },
    timeline: { deliveryDate, leadTime },
    terms: { payment, warranty, validity },
    compliance: { certifications, standards }
  },
  
  // Attachment Analysis
  attachments: [{
    filename: String,
    type: 'pdf' | 'image',
    extractedText: String,
    analysis: String
  }],
  
  // Reply History
  replyHistory: [{
    emailId: ObjectId,
    analyzedAt: Date,
    feedback: String,
    score: Number
  }],
  
  // AI Recommendation (from comparison)
  aiRecommendation: {
    rank: Number,
    isRecommended: Boolean,
    reasoning: String,
    rejectionReason: String
  },
  
  // Status
  status: 'pending' | 'analyzed' | 'accepted' | 'rejected',
  rejectionReason: String,
  
  timestamps
}
```

---

## 🔄 **Detailed Workflows**

### **Workflow 1: Vendor Reply Received**

```
1. Gmail Watch detects new email
   ↓
2. Check if it's a reply (has inReplyTo)
   ↓
3. Find original email → Get spaceId, vendorId
   ↓
4. Fetch space structured data
   ↓
5. Analyze reply content with Mistral 3:
   - Compare against space requirements
   - Generate personal feedback
   - Calculate score
   - Extract pricing, timeline, terms
   ↓
6. If attachments exist:
   - Fetch from Gmail API
   - Extract content (PDF text / Image analysis)
   - Analyze with Mistral 3
   ↓
7. Find existing proposal OR create new
   ↓
8. Update proposal:
   - Latest feedback
   - Latest score
   - Extracted data
   - Attachment analysis
   - Add to reply history
   ↓
9. Save to database
```

---

### **Workflow 2: Compare Proposals**

```
1. User navigates to /spaces/:spaceId/compare
   ↓
2. Frontend fetches:
   - Space details
   - All proposals for this space
   ↓
3. Display proposals:
   - Vendor name
   - Latest feedback
   - Score
   - Extracted data (pricing, timeline)
   - Attachment summaries
   ↓
4. Show "Get AI Recommendations" button
   (NOT auto-generated)
```

---

### **Workflow 3: Get AI Recommendations**

```
1. User clicks "Get AI Recommendations"
   ↓
2. Frontend calls: POST /api/vendor-proposals/space/:spaceId/recommendations
   ↓
3. Backend:
   - Fetches all proposals
   - Fetches space structured data
   - Sends to Mistral 3 with prompt:
     "Compare these vendors and recommend the best one.
      Explain WHY to select the best.
      Explain WHY to reject others."
   ↓
4. Mistral 3 returns:
   - Best vendor + reasoning
   - Rejection reasons for others
   - Ranking
   ↓
5. Update each proposal with AI recommendation
   ↓
6. Return to frontend
   ↓
7. Display visual results:
   - Winner highlighted (green)
   - Pros/Cons for each
   - Rejection reasons (red)
   - Ranking badges
```

---

### **Workflow 4: Accept Vendor**

```
1. User clicks "Accept" on vendor card
   ↓
2. Confirmation modal: "Accept this vendor?"
   ↓
3. User confirms
   ↓
4. Backend:
   - Update proposal status = 'accepted'
   - Send acceptance email to vendor
   - Find all other proposals for this space
   - Update them to status = 'rejected'
   - Send rejection emails to others
   - Update space status = 'closed'
   ↓
5. Frontend:
   - Show success message
   - Update UI to show "Accepted" badge
   - Disable other vendor cards
   - Show space as "Closed"
```

---

### **Workflow 5: Reject Vendor**

```
1. User clicks "Reject" on vendor card
   ↓
2. Modal: "Why are you rejecting this vendor?"
   ↓
3. User enters reason
   ↓
4. Backend:
   - Update proposal status = 'rejected'
   - Store rejection reason
   - Send rejection email to vendor
   - Space remains open
   ↓
5. Frontend:
   - Show "Rejected" badge on vendor card
   - Disable this vendor's actions
   - Other vendors remain active
```

---

## 🎨 **Frontend Components**

### **1. CompareProposalsPage**
- Displays all vendor proposals
- Side-by-side comparison
- "Get AI Recommendations" button
- Accept/Reject buttons

### **2. VendorProposalCard**
- Vendor name & company
- Personal feedback
- Score (0-100) with visual bar
- Extracted data (pricing, timeline)
- Attachment summaries
- AI recommendation (if generated)
- Accept/Reject buttons

### **3. AIRecommendationPanel**
- Winner announcement
- Detailed reasoning
- Pros/Cons list
- Rejection reasons for others
- Visual ranking

---

## 🔌 **API Endpoints**

### **Backend Routes:**

```typescript
// Automatic analysis (called by Gmail Watch)
POST /api/vendor-proposals/analyze
Body: { emailId }

// Get proposals for a space
GET /api/vendor-proposals/space/:spaceId

// Get AI recommendations
POST /api/vendor-proposals/space/:spaceId/recommendations

// Accept proposal
POST /api/vendor-proposals/:proposalId/accept

// Reject proposal
POST /api/vendor-proposals/:proposalId/reject
Body: { reason }
```

---

## 🎯 **Key Features**

### **✅ Automatic Analysis**
- Triggers on every vendor reply
- Updates proposal each time
- Stores reply history

### **✅ Personal Feedback**
- Specific to each vendor
- Based on space requirements
- Updated with each reply

### **✅ Attachment Analysis**
- PDF text extraction
- Image analysis
- Integrated into feedback

### **✅ AI Recommendations**
- On-demand (button click)
- Clear winner selection
- Detailed reasoning
- Rejection explanations

### **✅ Accept/Reject**
- Email notifications
- Auto-reject others on accept
- Space status updates
- Visual badges

---

## 📝 **Implementation Steps**

1. ✅ Update VendorProposal model
2. ✅ Implement automatic analysis service
3. ✅ Integrate with Gmail Watch
4. ✅ Implement attachment analysis
5. ✅ Create comparison API
6. ✅ Create recommendations API
7. ✅ Implement accept/reject logic
8. ✅ Build frontend components
9. ✅ Add email notifications
10. ✅ Test complete flow

---

**This is the complete system design!** 🎉

Ready to implement? Let's build it! 🚀
