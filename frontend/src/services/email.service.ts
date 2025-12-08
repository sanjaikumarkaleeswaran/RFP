import { fetchWrapper } from '../shared/utils/fetchWrapper';
import type { Email } from '../types';

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
    sendViaGmail: async (emailData: {
        to: string;
        subject: string;
        body: string;
        inReplyTo?: string;
        threadId?: string;
        vendorId?: string;
        spaceId?: string;
    }): Promise<any> => {
        // Send body as HTML to ensure it's saved to bodyHtml field
        return await fetchWrapper('POST', '/emails/gmail/send', {
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.body,  // Send as HTML
            inReplyTo: emailData.inReplyTo,
            threadId: emailData.threadId,
            vendorId: emailData.vendorId,
            spaceId: emailData.spaceId
        });
    },

    // Check for new replies from Gmail
    checkForReplies: async (): Promise<{ success: boolean; message: string; data: any[] }> => {
        return await fetchWrapper('POST', '/emails/check-replies', {});
    }
};
