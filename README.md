# Nova - AI-Powered RFP Management System

Nova is a single-user web application designed to streamline the Request for Proposal (RFP) process using Artificial Intelligence. It enables users to create structured RFPs from natural language, manage vendors, send proposals via email (Gmail integration), and automatically analyze and compare vendor responses using AI.

## 🚀 Features

*   **AI-Driven RFP Creation**: Convert natural language descriptions into structured RFP requirements.
*   **Vendor Management**: Maintain a database of vendors and their contact details.
*   **Email Integration**:
    *   Seamless integration with Gmail API for sending RFPs and tracking threads.
    *   Automatic detection of vendor replies in the inbox.
*   **Automated Analysis**:
    *   AI parsing of inbound vendor emails and attachments (PDFs).
    *   Extraction of key proposal details (price, timeline, warranty, etc.) into a structured format.
*   **Intelligent Comparison**: Side-by-side comparison of proposals with AI-generated recommendations and scoring.
*   **Modern UI**: Built with React, TailwindCSS, and Shadcn/UI for a premium, responsive experience.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: TailwindCSS, Shadcn UI, Radix UI
*   **State & Data Fetching**: React Query (@tanstack/react-query)
*   **Forms**: React Hook Form + Zod
*   **Icons**: Lucide React, React Icons

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: MongoDB (Mongoose ODM)
*   **Authentication**: JWT (JSON Web Tokens)
*   **Email**: Gmail API (googleapis), Nodemailer
*   **AI**: Google Gemini API (`@google/generative-ai`)
*   **File Handling**: Multer (memory storage), PDF Parse

## ⚙️ Project Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (Local instance or Atlas URI)
*   Google Cloud Console Project (for Gmail API)
    *   Enabled APIs: Gmail API
    *   OAuth 2.0 Credentials (Client ID & Secret)
*   Google AI Studio API Key (Gemini)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd nova
    ```

2.  **Install dependencies (Root, Frontend, Backend):**
    ```bash
    npm install
    ```
    *This will install dependencies for the root, frontend, and backend workspaces.*

3.  **Environment Configuration:**
    *   Copy the `.env.example` file to `.env` in the root directory:
        ```bash
        cp .env.example .env
        ```
    *   Update `.env` with your actual credentials:
        *   `MONGO_URI`: Your MongoDB connection string.
        *   `GEMINI_API_KEY`: Your API key from Google AI Studio.
        *   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
        *   `GOOGLE_REDIRECT_URI`: Set to `http://localhost:5000/api/emails/gmail/oauth/callback` (or your backend URL).

### Running Locally

1.  **Start the development servers:**
    From the root directory, run:
    ```bash
    npm run dev
    ```
    This command uses `concurrently` to start both the backend (Port 5000) and frontend (Port 5173).

2.  **Access the Application:**
    Open your browser and navigate to `http://localhost:5173`.

### Seed Data
The application allows you to create data through the UI. No specific seed scripts are required to start, but you can create a test Vendor and generic Space (RFP) to begin.

## 📖 API Documentation

### Auth
*   `POST /api/auth/register` - Create a new user account.
*   `POST /api/auth/login` - Authenticate and receive a JWT.
*   `GET /api/auth/me` - Get current user profile.

### Spaces (RFPs)
*   `POST /api/spaces` - Create a new Space (RFP project).
*   `POST /api/spaces/:id/parse` - Parse natural language into structured requirements (AI).
*   `POST /api/spaces/:id/send-rfp` - Send RFP emails to selected vendors.
*   `GET /api/spaces/:id/proposals/compare` - Get comparison data for all proposals in a space.

### Vendors
*   `GET /api/vendors` - List all vendors.
*   `POST /api/vendors` - Add a new vendor.
*   `GET /api/vendors/search` - Search vendors by name or existing database.

### Emails & Gmail
*   `GET /api/emails/gmail/auth-url` - Start Gmail OAuth flow.
*   `POST /api/emails/gmail/check-replies` - Manual trigger to check inbox for vendor replies.
*   `GET /api/emails/vendor/:vendorId` - Get email history for a specific vendor.

### Vendor Proposals
*   `POST /api/vendor-proposals/analyze` - Trigger AI analysis of a specific email/reply.
*   `POST /api/vendor-proposals/:id/accept` - Mark a proposal as accepted.
*   `POST /api/vendor-proposals/:id/reject` - Mark a proposal as rejected.

## 🧠 Decisions & Assumptions

### Key Design Decisions
1.  **Single-User Focus**: The app is designed for a single procurement manager. Multi-tenancy is not implemented to focus on the depth of the workflow.
2.  **Gmail API over SMTP**: To handle "replies" effectively, standard SMTP is insufficient. The Google Gmail API is used to track `Thread-ID` and `Message-ID`, ensuring that vendor responses are correctly linked to the original RFP email.
3.  **Real-Time Parsing vs Batch**: Vendor proposals are parsed asynchronously or on-demand. When a new email arrives, the system attempts to match it to a Space. The user can then "Analyze" the content using Gemini to extract structured data.

### Assumptions
*   **Email Format**: It is assumed vendors reply to the thread. If they send a fresh email, the system attempts to match based on the Vendor's email address and active RFPs.
*   **Attachment Types**: The system primarily supports PDF and text/plain attachments for analysis.
*   **Currency**: The system currently defaults to USD ($) for comparisons.

## 🤖 AI Tools Usage

This project was built with the assistance of advanced AI coding agents and LLMs.

*   **Tools Used**: Google Gemini (via API), AI Coding Assistant (for code generation and debugging).
*   **Role of AI**:
    *   **Architecture**: Helped structure the Monorepo and decide on the MERN stack.
    *   **Code Generation**: Generated boilerplate for Express routes, Mongoose models, and React components.
    *   **Algorithm Design**: Assisted in writing the `GmailAPIService` logic for thread tracking and the complex prompt engineering required for extracting JSON data from messy vendor emails.
    *   **Debugging**: Helped resolve issues with OAuth2 flows and asynchronous state updates in React.
*   **Prompts/Approaches**:
    *   Detailed context was provided to the AI to generate the extraction schemas (Zod).
    *   "Chain of thought" prompting was used for the comparison logic to ensure the AI explains *why* a vendor is recommended.

