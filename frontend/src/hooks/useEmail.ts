import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailService, type SendEmailRequest, type BulkEmailRequest } from '../services/email.service';
import { toast } from 'sonner';

export function useEmail() {
    const queryClient = useQueryClient();

    // Send single email via SMTP
    const sendEmail = useMutation({
        mutationFn: (data: SendEmailRequest) => emailService.sendEmail(data),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Email sent successfully to ${data.recipient}`);
                queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
            } else {
                toast.error(data.error || 'Failed to send email');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to send email');
        }
    });

    // Send bulk emails via SMTP
    const sendBulkEmails = useMutation({
        mutationFn: (data: BulkEmailRequest) => emailService.sendBulkEmails(data),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Sent ${data.sent} of ${data.total} emails successfully`);
                if (data.failed > 0) {
                    toast.error(`${data.failed} emails failed to send`);
                }
                queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to send bulk emails');
        }
    });

    // Send email via Gmail API
    const sendViaGmail = useMutation({
        mutationFn: (data: SendEmailRequest & { spaceId?: string }) => emailService.sendViaGmail(data),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Email sent via Gmail to ${data.recipient}`);
                queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
            } else {
                toast.error(data.error || 'Failed to send email via Gmail');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to send email via Gmail');
        }
    });

    // Check for new Gmail replies
    const checkReplies = useMutation({
        mutationFn: () => emailService.checkGmailReplies(),
        onSuccess: (data) => {
            if (data.success) {
                if (data.count > 0) {
                    toast.success(`Found ${data.count} new ${data.count === 1 ? 'reply' : 'replies'}`);
                } else {
                    toast.success('No new replies found');
                }
                queryClient.invalidateQueries({ queryKey: ['replies'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to check replies');
        }
    });

    // Disconnect Gmail
    const disconnectGmail = useMutation({
        mutationFn: () => emailService.disconnectGmail(),
        onSuccess: () => {
            toast.success('Gmail disconnected successfully');
            queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to disconnect Gmail');
        }
    });

    return {
        sendEmail,
        sendBulkEmails,
        sendViaGmail,
        checkReplies,
        disconnectGmail
    };
}

export function useGmailStatus() {
    return useQuery({
        queryKey: ['gmail-status'],
        queryFn: () => emailService.getGmailStatus(),
        refetchInterval: 30000 // Refetch every 30 seconds
    });
}

export function useReplies(spaceId?: string) {
    return useQuery({
        queryKey: ['replies', spaceId],
        queryFn: () => emailService.getReplies(spaceId),
        refetchInterval: 10000 // Auto-refresh every 10 seconds
    });
}

export function useSentEmails(spaceId?: string) {
    return useQuery({
        queryKey: ['sent-emails', spaceId],
        queryFn: () => emailService.getSentEmails(spaceId)
    });
}
