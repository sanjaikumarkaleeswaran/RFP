export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface Space {
  id: string;
  ownerId?: string;
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
  addresses?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }[];
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
  userId?: string;
  spaceId?: string;
  gmailMessageId?: string;
  messageId?: string;
  threadId?: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  subject?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  date?: string;
  direction?: 'INBOUND' | 'OUTBOUND' | 'inbound' | 'outbound';
  provider?: 'GMAIL' | 'IMAP' | 'MANUAL';
  isImported?: boolean;
  isReply?: boolean;
  importedToSpaceId?: string;
  vendorId?: { id: string; name: string; email?: string } | string;
  attachments?: {
    filename: string;
    mimeType: string;
    size: number;
    attachmentId?: string;
    contentId?: string;
    inline?: boolean;
  }[];
  createdAt: Date | string;
  receivedAt?: Date | string;
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

export interface VendorEmailStatus {
  vendorId: string;
  sent: boolean;
  sentAt?: Date;
  received: boolean;
  receivedAt?: Date;
}
