// email.service.ts
// NOTE: 'resend' package is not installed. This service delegates to smtpEmailService.
import { smtpEmailService } from './smtp-email.service';

class EmailService {
    /**
     * Send a single email (delegates to SMTP service)
     */
    async sendEmail(params: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const result = await smtpEmailService.sendEmail({
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
        });
        return {
            success: result.success,
            messageId: result.messageId,
            error: result.error,
        };
    }

    /**
     * Send email to multiple recipients
     */
    async sendBulkEmails(emails: Array<{
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }>): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
        const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = [];
        for (const email of emails) {
            const result = await this.sendEmail(email);
            results.push({ to: email.to, ...result });
        }
        return results;
    }
}

export const emailService = new EmailService();
