# 🚀 Nova — AI-Powered RFP Management System

<div align="center">

![Nova Banner](https://img.shields.io/badge/Nova-RFP%20Management-6366f1?style=for-the-badge&logo=sparkles&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production%20Ready-22c55e?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

**Nova** is a single-user, AI-powered web application that streamlines the end-to-end Request for Proposal (RFP) process — from drafting requirements in natural language to automatically comparing and selecting the best vendor using AI.

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#️-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [API Reference](#-api-reference)
- [User Workflow](#-user-workflow)
- [Design Decisions](#-design-decisions)
- [AI Tools Used](#-ai-tools-used)

---

## ✨ Features

### 🔐 Authentication & User Management
- Email/password registration and login
- JWT-based session management with protected routes
- User profile management and session persistence

### 📧 Gmail Integration (Full OAuth 2.0)
- Connect personal Gmail account via Google OAuth
- **Send RFP emails** directly through Gmail API
- **Auto-detect vendor replies** via Gmail Watch (polling) and Gmail Webhook (push notifications via Google Pub/Sub)
- Email thread tracking — replies automatically linked to the original RFP
- Full attachment handling (upload, download, PDF/image preview)
- SMTP fallback support for sending

### 🏢 Vendor Management
- Full CRUD (Create, Read, Update, Delete) for vendors
- Multiple email addresses per vendor
- Categorization, search, and filtering
- Vendor statistics: proposal count, acceptance rate

### 📦 Spaces (RFP Projects)
- Create and manage multiple RFP workspaces
- Input requirements in **plain natural language**
- **AI-powered requirement parsing** — converts freeform text into structured RFP data
- **AI-generated professional email templates** (editable)
- Vendor selection by category
- **Bulk RFP sending** to multiple vendors simultaneously
- Status management: `draft → sent → evaluating → closed`
- File attachment support

### 🤖 AI-Powered Proposal Analysis
- **Automatic detection** of vendor replies (no manual trigger needed)
- AI extraction of key proposal details: price, timeline, warranty, terms
- **Scoring system** (0–100) with personalized feedback per vendor
- PDF attachment parsing and analysis
- Image analysis via OCR and captioning
- Strengths and weaknesses identification

### 📊 Comparison & Decision Engine
- Side-by-side proposal comparison table
- AI-generated recommendations: **who to pick and why**
- Visual scoring with progress bars
- **Accept Vendor** → system auto-sends acceptance email + rejection emails to others
- Full audit trail of accept/reject reasons

### 🖥️ Dashboard & Settings
- Live KPI overview: open RFPs, unread emails, proposals received
- Recent activity feed and quick actions
- Gmail OAuth connection status and management

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| TypeScript | Type safety |
| TailwindCSS + Shadcn UI | Styling & component library |
| Radix UI | Accessible UI primitives |
| React Query (`@tanstack/react-query`) | Server state management & caching |
| React Hook Form + Zod | Form handling & validation |
| Lucide React | Icons |
| Sonner | Toast notifications |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server & REST API |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication tokens |
| Gmail API (`googleapis`) | Email send/receive/watch |
| Nodemailer | SMTP email fallback |
| Multer | File upload handling (memory storage) |
| pdf-parse | PDF text extraction |

### AI / ML
| Model / Service | Purpose |
|---|---|
| Google Gemini API | Natural language requirement parsing, email template generation |
| Groq API | Fast LLM inference for proposal analysis |
| Hugging Face Inference API | Image captioning (BLIP) & OCR (TrOCR) |

---

## 📁 Project Structure

```
nova/                          # Monorepo root (npm workspaces)
├── frontend/                  # React + TypeScript (Vite)
│   └── src/
│       ├── pages/             # All application pages
│       ├── components/        # Reusable UI components
│       │   ├── spaces/        # Space/RFP components
│       │   └── vendors/       # Vendor components
│       ├── services/          # API service layer (fetch wrappers)
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Utilities & helpers
│
├── backend/                   # Node.js + Express + TypeScript
│   └── src/
│       ├── modules/           # Feature modules (MVC pattern)
│       │   ├── auth/          # JWT authentication
│       │   ├── email/         # Email management
│       │   ├── space/         # RFP space CRUD
│       │   ├── vendor/        # Vendor CRUD
│       │   ├── vendor-proposal/ # AI analysis & comparison
│       │   └── webhooks/      # Gmail push notification handling
│       └── common/
│           ├── services/      # Shared services
│           │   ├── gmail-api.service.ts
│           │   ├── gmail-watch.service.ts
│           │   ├── gmail-webhook.service.ts
│           │   ├── gmail-attachment.service.ts
│           │   ├── email-thread.service.ts
│           │   └── llm.service.ts
│           └── middlewares/   # Auth & error handling
│
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment variable template
├── .gitignore
├── package.json               # Root workspace config
└── README.md
```

---

## 📌 Prerequisites

Before setting up Nova, make sure you have:

- **Node.js** v18 or higher
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI
- **Google Cloud Console** project with:
  - Gmail API enabled
  - OAuth 2.0 Client ID & Secret configured
  - Authorised redirect URI set to: `http://localhost:5000/api/emails/gmail/oauth/callback`
- **Google AI Studio** — [Gemini API Key](https://aistudio.google.com/app/apikey)
- **Groq** — [API Key](https://console.groq.com/)
- **Hugging Face** — [API Key](https://huggingface.co/settings/tokens) (free tier is sufficient)
- *(Optional)* A tunneling tool like [ngrok](https://ngrok.com/) if you want to use Gmail Webhooks (push notifications) in development

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/samarkaleeswaran/RFP.git
cd RFP
```

### 2. Install All Dependencies

From the **root** directory, a single command installs dependencies for the root, frontend, and backend workspaces:

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values (see [Environment Variables](#-environment-variables) below).

---

## 🔑 Environment Variables

Create a `.env` file in the **root** directory with the following variables:

```env
# ─── AI API Keys ──────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# ─── Database ─────────────────────────────────────────────────
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nova

# ─── Authentication ───────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here

# ─── Server ───────────────────────────────────────────────────
PORT=5000

# ─── Email (SMTP Fallback) ────────────────────────────────────
USE_GMAIL_SMTP=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password_here
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=Nova RFP

# ─── Gmail OAuth2 (Google Cloud Console) ──────────────────────
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/emails/gmail/oauth/callback

# ─── Gmail Webhook (optional, for push notifications) ─────────
WEBHOOK_URL=https://your-ngrok-tunnel.ngrok.io/api/emails/gmail/webhook/notifications
GMAIL_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-notifications
```

> **Tip:** For Gmail push notifications (webhooks) in development, run `ngrok http 5000` and set `WEBHOOK_URL` to the generated HTTPS URL.

---

## 🚀 Running Locally

Start **both** the backend and frontend simultaneously from the root directory:

```bash
npm run dev
```

This uses `concurrently` to run:
- **Backend** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173`

### Run Services Individually

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

---

## 📖 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Spaces (RFP Projects)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/spaces` | Create a new RFP Space |
| `GET` | `/api/spaces` | List all Spaces |
| `GET` | `/api/spaces/:id` | Get Space details |
| `POST` | `/api/spaces/:id/parse` | AI: parse natural language requirements |
| `POST` | `/api/spaces/:id/generate-template` | AI: generate email template |
| `POST` | `/api/spaces/:id/send-rfp` | Send RFP emails to selected vendors |
| `GET` | `/api/spaces/:id/proposals/compare` | Get comparison data for all proposals |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors` | List all vendors |
| `POST` | `/api/vendors` | Add a new vendor |
| `GET` | `/api/vendors/search` | Search vendors by name or category |
| `PUT` | `/api/vendors/:id` | Update vendor details |
| `DELETE` | `/api/vendors/:id` | Delete a vendor |

### Gmail & Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/emails/gmail/auth-url` | Start Gmail OAuth 2.0 flow |
| `GET` | `/api/emails/gmail/oauth/callback` | OAuth callback handler |
| `GET` | `/api/emails/gmail/inbox` | Fetch Gmail inbox messages |
| `POST` | `/api/emails/gmail/check-replies` | Manually trigger inbox scan for replies |
| `POST` | `/api/emails/gmail/watch/start` | Start Gmail polling (Watch) |
| `POST` | `/api/emails/gmail/webhook/start` | Start Gmail push notifications (Pub/Sub) |
| `POST` | `/api/emails/gmail/webhook/notifications` | Receive Gmail push notification events |
| `GET` | `/api/emails/vendor/:vendorId` | Get email thread history for a vendor |

### Vendor Proposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendor-proposals/space/:spaceId` | Get all proposals for a Space |
| `POST` | `/api/vendor-proposals/space/:spaceId/compare` | AI: generate comparison & recommendation |
| `POST` | `/api/vendor-proposals/analyze` | AI: analyze a specific email/reply |
| `POST` | `/api/vendor-proposals/:id/accept` | Accept a vendor's proposal |
| `POST` | `/api/vendor-proposals/:id/reject` | Reject a vendor's proposal |

---

## 🔄 User Workflow

```
1. Register / Login
        │
2. Connect Gmail (OAuth 2.0)
        │
3. Add Vendors (name, email, category)
        │
4. Create a Space (RFP Project)
        │
5. Enter requirements in plain English
        │
        ▼
   [Gemini AI] → Structured requirements + Email template
        │
6. Select vendors & send bulk RFP emails
        │
7. Vendors reply to email thread
        │
        ▼
   [Gmail Watch / Webhook] → Auto-detects reply
        │
   [AI Pipeline] → Extracts data, scores vendor (0-100)
        │
8. View Compare Proposals page
        │
9. Click "Get AI Recommendations"
        │
        ▼
   [Groq / Gemini] → Recommends best vendor with reasoning
        │
10. Accept vendor → System sends acceptance + rejection emails
                    Space automatically closes
```

---

## 🧠 Design Decisions

### 1. Single-User Focus
The app is intentionally single-user to maximize depth of the RFP workflow rather than breadth with multi-tenancy infrastructure.

### 2. Gmail API Over SMTP (for Receiving)
Standard SMTP cannot track email replies within a thread. The Gmail API provides `Thread-ID` and `Message-ID`, which allows accurate linking of vendor responses back to the original RFP email.

### 3. Dual Detection Strategy (Watch + Webhook)
- **Gmail Watch (polling)**: Works in any environment, including local development.
- **Gmail Webhook (Pub/Sub push)**: Real-time and low-latency, ideal for production. Requires a publicly accessible URL.

### 4. AI Model Selection
- **Google Gemini**: Best for structured data generation (requirement parsing, template creation) due to its strong instruction-following.
- **Groq**: Used for fast inference during comparison to deliver snappy user experience.
- **Hugging Face**: Free-tier vision models (BLIP, TrOCR) for image analysis without additional cost.

### 5. Monorepo with npm Workspaces
Frontend and backend share a single repository with npm workspaces, allowing shared type definitions and a single `npm install` command.

---

## 🤖 AI Tools Used

This project was architected and built with significant assistance from AI tools:

| Tool | Role |
|------|------|
| **Google Gemini (via API)** | Requirement parsing, email template generation, proposal analysis |
| **Groq API** | Fast LLM inference for comparison & recommendation |
| **Hugging Face** | Free vision models for image/PDF analysis |
| **AI Coding Assistant** | Architecture guidance, code generation, debugging |

**AI Contributions:**
- **Architecture**: Helped design the monorepo structure and feature module layout
- **Prompt Engineering**: Iteratively refined prompts for JSON data extraction from unstructured vendor emails
- **Gmail Integration**: Assisted with OAuth2 flow edge cases and Pub/Sub webhook setup
- **Debugging**: Resolved async state management issues in React Query and Express middleware chains

---

## 📊 Feature Completion Status

| Module | Backend | Frontend | Status |
|--------|---------|----------|--------|
| Authentication | ✅ 100% | ✅ 100% | ✅ Complete |
| Gmail OAuth & Integration | ✅ 100% | ✅ 100% | ✅ Complete |
| Gmail Watch (Polling) | ✅ 100% | ✅ 100% | ✅ Complete |
| Gmail Webhook (Push) | ✅ 100% | ✅ 100% | ✅ Complete |
| Vendor Management | ✅ 100% | ✅ 100% | ✅ Complete |
| Space / RFP Management | ✅ 100% | ✅ 100% | ✅ Complete |
| AI Requirement Parsing | ✅ 100% | ✅ 100% | ✅ Complete |
| AI Email Template Generation | ✅ 100% | ✅ 100% | ✅ Complete |
| Bulk RFP Email Sending | ✅ 100% | ✅ 100% | ✅ Complete |
| Auto Reply Detection | ✅ 100% | ✅ 100% | ✅ Complete |
| AI Proposal Analysis | ✅ 100% | ✅ 100% | ✅ Complete |
| PDF & Image Analysis | ✅ 100% | ✅ 100% | ✅ Complete |
| Proposal Comparison | ✅ 100% | ✅ 100% | ✅ Complete |
| AI Vendor Recommendations | ✅ 100% | ✅ 100% | ✅ Complete |
| Accept / Reject Workflow | ✅ 100% | ✅ 100% | ✅ Complete |
| Dashboard | ✅ 100% | ✅ 100% | ✅ Complete |
| Settings | ✅ 100% | ✅ 100% | ✅ Complete |

**Overall: 100% Complete** 🎉

---

## 💰 Cost Estimate

| Service | Tier | Cost |
|---------|------|------|
| Hugging Face Inference API | Free (1,000 req/day) | **$0** |
| Google Gemini API | Free tier available | **$0** for typical usage |
| Groq API | Free tier available | **$0** for typical usage |
| Gmail API | Free (1B quota units/day) | **$0** |
| MongoDB Atlas | Free M0 cluster | **$0** |

> For a typical small-scale deployment (50 vendors, ~60 API calls/month), the total infrastructure cost is **$0**.

---

## 🔮 Potential Future Enhancements

- [ ] Multi-user / team support with role-based access control
- [ ] Microsoft Outlook integration
- [ ] Export proposals to PDF or Excel
- [ ] Advanced analytics & reporting dashboard
- [ ] Real-time notifications via WebSocket
- [ ] Vendor performance history tracking across multiple RFPs
- [ ] Proposal template library
- [ ] Mobile application

---

<div align="center">

**Last Updated:** February 2026 &nbsp;|&nbsp; **Status:** 🟢 Fully Operational & Production Ready

Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI

</div>
