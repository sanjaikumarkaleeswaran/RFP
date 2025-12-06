import { Resend } from 'resend';

class EmailService {
    private resend: Resend;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            console.warn('⚠️  RESEND_API_KEY not found. Email sending will be simulated.');
            this.resend = null as any;
        } else {
            this.resend = new Resend(apiKey);
            console.log('✅ Resend Email Service initialized');
        }

        this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
        this.fromName = process.env.FROM_NAME || 'Nova RFP System';
    }

    /**
     * Send an email using Resend
     */
    async sendEmail(params: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // If no API key, simulate sending
            if (!this.resend) {
                console.log('📧 [SIMULATED] Sending email to:', params.to);
                console.log('   Subject:', params.subject);
                console.log('   Content:', params.text?.substring(0, 100) + '...');
                return {
                    success: true,
                    messageId: `simulated-${Date.now()}`
                };
            }
            console.log({ params, a: this.fromName, b: this.fromEmail });
            // Actually send email via Resend
            const { data, error } = await this.resend.emails.send({
                from: `${this.fromName} <${this.fromEmail}>`,
                to: params.to,
                subject: params.subject,
                text: params.text,
                html: params.html || params.text?.replace(/\n/g, '<br>')
            } as any);
            console.log({ data, error });

            if (error) {
                console.error('❌ Failed to send email:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to send email'
                };
            }

            console.log('✅ Email sent successfully to:', params.to);
            console.log('   Message ID:', data);

            return {
                success: true,
                messageId: data?.id,

            };
        } catch (error) {
            console.error('❌ Email sending error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
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
            results.push({
                to: email.to,
                ...result
            });
        }

        return results;
    }
}

export const emailService = new EmailService();
