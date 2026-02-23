import { fetchWrapper } from '../shared/utils/fetchWrapper';
import type { Email } from '../types';
export type { Email };

export interface SendEmailRequest {
    to: string;
    subject: string;
    body: string;
    html?: string;
    recipient?: string; // Backwards compatibility for frontend hook
    inReplyTo?: string;
    threadId?: string;
    vendorId?: string;
    spaceId?: string;
}

export interface BulkEmailRequest {
    recipients: string[];
    subject: string;
    body: string;
}

export const emailService = {
    // Get Gmail inbox from Gmail API
    getGmailInbox: async (pageToken?: string, maxResults: number = 20): Promise<any> => {
        const params = new URLSearchParams();
        if (pageToken) params.append('pageToken', pageToken);
        params.append('maxResults', maxResults.toString());

        return await fetchWrapper('GET', `/emails/gmail/inbox?${params.toString()}`);
    },

    // Import email to space (saves Gmail message to database)
    importToSpace: async (gmailMessageId: string, spaceId: string): Promise<any> => {
        return await fetchWrapper('POST', `/emails/${gmailMessageId}/import`, { spaceId });
    },

    // Map email to vendor
    mapToVendor: async (emailId: string, vendorId: string): Promise<any> => {
        return await fetchWrapper('POST', `/emails/${emailId}/map-vendor`, { vendorId });
    },

    // Get imported emails for a space
    getImportedEmails: async (spaceId: string): Promise<{ success: boolean; count: number; data: Email[] }> => {
        return await fetchWrapper('GET', `/emails/imported/${spaceId}`);
    },

    // Get imported emails count for a space
    getImportedEmailsCount: async (spaceId: string): Promise<{ success: boolean; count: number }> => {
        return await fetchWrapper('GET', `/emails/imported/count/${spaceId}`);
    },

    // Get Gmail status
    getGmailStatus: async (): Promise<any> => {
        return await fetchWrapper('GET', '/emails/gmail/status');
    },

    // Get Gmail auth URL
    getGmailAuthUrl: async (): Promise<{ success: boolean; authUrl: string }> => {
        return await fetchWrapper('GET', '/emails/gmail/auth-url');
    },

    // Disconnect Gmail
    disconnectGmail: async (): Promise<any> => {
        return await fetchWrapper('POST', '/emails/gmail/disconnect');
    },

    // Get emails for a specific vendor
    getVendorEmails: async (vendorId: string): Promise<{ success: boolean; data: Email[] }> => {
        return await fetchWrapper('GET', `/emails/vendor/${vendorId}`);
    },

    // Send email via Gmail API
    sendViaGmail: async (emailData: SendEmailRequest): Promise<any> => {
        // Send body as HTML to ensure it's saved to bodyHtml field
        return await fetchWrapper('POST', '/emails/gmail/send', {
            to: emailData.to || emailData.recipient,
            subject: emailData.subject,
            html: emailData.html || emailData.body,  // Send as HTML if avail, else fallback to body
            inReplyTo: emailData.inReplyTo,
            threadId: emailData.threadId,
            vendorId: emailData.vendorId,
            spaceId: emailData.spaceId
        });
    },

    // Check for new replies from Gmail (polling)
    checkForReplies: async (): Promise<{ success: boolean; message: string; count: number; data: any[] }> => {
        return await fetchWrapper('POST', '/emails/check-replies', {});
    },

    // Alias for checkForReplies to match frontend hook usage
    checkGmailReplies: async (): Promise<{ success: boolean; message: string; count: number; data: any[] }> => {
        return await fetchWrapper('POST', '/emails/check-replies', {});
    },

    // Send single email (SMTP)
    sendEmail: async (data: SendEmailRequest): Promise<any> => {
        return await fetchWrapper('POST', '/emails/send', {
            to: data.to || data.recipient,
            subject: data.subject,
            text: data.body,
            html: data.html
        });
    },

    // Send bulk emails (SMTP)
    sendBulkEmails: async (data: BulkEmailRequest): Promise<any> => {
        return await fetchWrapper('POST', '/emails/bulk', data);
    },

    // Get all replies
    getReplies: async (spaceId?: string): Promise<any> => {
        const url = spaceId ? `/emails/replies?spaceId=${spaceId}` : '/emails/replies';
        return await fetchWrapper('GET', url);
    },

    // Get sent emails
    getSentEmails: async (spaceId?: string): Promise<any> => {
        const url = spaceId ? `/emails/sent?spaceId=${spaceId}` : '/emails/sent';
        return await fetchWrapper('GET', url);
    }
};
