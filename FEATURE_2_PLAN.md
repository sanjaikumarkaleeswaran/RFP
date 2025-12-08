# 🚀 **Feature 2: Compare Proposals Screen**

## 📋 **What This Feature Does**

Displays all vendor proposals for a space in a comparison view:
- ✅ Shows all vendors who replied
- ✅ Displays personal feedback for each
- ✅ Shows scores (0-100) with visual bars
- ✅ Displays extracted data (pricing, timeline)
- ✅ Shows attachment summaries
- ✅ Side-by-side comparison
- ✅ **NO AI recommendations yet** (that's Feature 3)

---

## 🎨 **UI Design**

### **Page Layout:**
```
┌─────────────────────────────────────────────────┐
│  Compare Proposals - [Space Name]              │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [Get AI Recommendations] ← Feature 3          │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ Vendor 1     │  │ Vendor 2     │           │
│  │ Score: 85/100│  │ Score: 72/100│           │
│  │ ████████░░   │  │ ███████░░░   │           │
│  │              │  │              │           │
│  │ Personal     │  │ Personal     │           │
│  │ Feedback...  │  │ Feedback...  │           │
│  │              │  │              │           │
│  │ Pricing: $5k │  │ Pricing: $6k │           │
│  │ Timeline: 2m │  │ Timeline: 3m │           │
│  │              │  │              │           │
│  │ Attachments: │  │ Attachments: │           │
│  │ • proposal.pdf│ │ • quote.pdf  │           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
```

---

## 📝 **Implementation Steps**

### **Backend:**

**Step 1: Create API Endpoint**
- `GET /api/vendor-proposals/space/:spaceId`
- Returns all proposals for a space
- Includes vendor info, scores, feedback

**Step 2: Create Controller**
- `getProposalsBySpace(spaceId)`
- Fetches proposals
- Populates vendor and email data
- Returns formatted response

---

### **Frontend:**

**Step 3: Update Service**
- Add `getProposalsBySpace(spaceId)` method
- Fetches from API

**Step 4: Create/Update CompareProposalsPage**
- Fetch proposals on load
- Display vendor cards
- Show personal feedback
- Display scores with progress bars
- Show extracted data
- List attachments

**Step 5: Create VendorProposalCard Component**
- Vendor info (name, company, email)
- Score visualization
- Personal feedback
- Extracted data (pricing, timeline)
- Attachment list
- Status badge

---

## 🔄 **Data Flow**

```
User navigates to /spaces/:spaceId/compare
    ↓
Frontend: Fetch proposals
    ↓
API: GET /api/vendor-proposals/space/:spaceId
    ↓
Backend: Query database
    ↓
Return proposals with:
  - Vendor info
  - Personal feedback
  - Scores
  - Extracted data
  - Attachments
    ↓
Frontend: Display in cards
    ↓
User sees comparison
```

---

## 📊 **API Response Format**

```json
{
  "proposals": [
    {
      "id": "...",
      "vendor": {
        "id": "...",
        "name": "Vendor A",
        "email": "vendor@example.com",
        "company": "Tech Solutions Inc"
      },
      "personalFeedback": "Thank you for your proposal...",
      "overallScore": 85,
      "strengths": ["Competitive pricing", "Good timeline"],
      "weaknesses": ["Missing certification"],
      "extractedData": {
        "pricing": {
          "total": 5000,
          "currency": "USD"
        },
        "timeline": {
          "deliveryDate": "2025-03-01",
          "leadTime": "2 months"
        }
      },
      "attachments": [
        {
          "filename": "proposal.pdf",
          "analysisType": "pdf",
          "insights": "..."
        }
      ],
      "status": "analyzed",
      "createdAt": "2025-12-07T14:30:00Z"
    }
  ],
  "space": {
    "id": "...",
    "name": "Website Redesign Project",
    "requirements": "..."
  }
}
```

---

## ✅ **Implementation Checklist**

### **Backend:**
- [ ] Create controller method
- [ ] Create route
- [ ] Test API endpoint

### **Frontend:**
- [ ] Update service
- [ ] Create/Update CompareProposalsPage
- [ ] Create VendorProposalCard component
- [ ] Add routing
- [ ] Style components

---

## 🎯 **Success Criteria**

Feature 2 is complete when:
- ✅ User can navigate to compare page
- ✅ All vendor proposals displayed
- ✅ Personal feedback shown for each
- ✅ Scores displayed with visual bars
- ✅ Extracted data visible
- ✅ Attachments listed
- ✅ Clean, organized layout

---

**Ready to implement!** 🚀
