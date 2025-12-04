export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface Space {
  id: string;
  ownerId: string;
  name: string;
  categories: string[];
  description?: string;
  requirements?: string;
  structuredData?: any;
  emailTemplate?: string;
  status: 'DRAFT' | 'SENT' | 'EVALUATING' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  emails: string[];
  phones?: string[];
  categories: string[];
  notes?: string;
  proposalsCount?: number;
  acceptedCount?: number;
  rejectedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Email {
  id: string;
  userId: string;
  spaceId?: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  subject?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  direction: 'INBOUND' | 'OUTBOUND';
  provider: 'GMAIL' | 'IMAP' | 'MANUAL';
  createdAt: Date;
}

export interface Proposal {
  id: string;
  spaceId: string;
  vendorId?: string;
  sourceEmailId: string;
  rawText: string;
  extracted: {
    prices?: Array<{ item?: string; price: number; currency?: string }>;
    terms?: string;
    delivery?: string;
    validity?: string;
    completenessScore?: number;
  };
  status: 'NEW' | 'PARSED' | 'NEED_REVIEW' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
