import nodemailer from 'nodemailer';
import { Email, IEmail } from '../../modules/email/model';
import mongoose from 'mongoose';

interface EmailAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
}

interface SendEmailParams {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: EmailAttachment[];
    userId?: mongoose.Types.ObjectId;
    spaceId?: mongoose.Types.ObjectId;
    vendorId?: mongoose.Types.ObjectId;  // Added for vendor tracking
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    emailId?: string;  // Added for compatibility
    error?: string;
    recipient: string;
}

class SMTPEmailService {
    private transporter: nodemailer.Transporter | null = null;
    private fromEmail: string;
    private fromName: string;
    private isConfigured: boolean = false;

    constructor() {
        this.fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@nova-rfp.com';
        this.fromName = process.env.SMTP_FROM_NAME || process.env.FROM_NAME || 'Nova RFP System';
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        // Check if Gmail SMTP is configured
        const useGmailSMTP = process.env.USE_GMAIL_SMTP === 'true';

        console.log({ useGmailSMTP, smtpUser, smtpPass, smtpHost, smtpPort })

        if (useGmailSMTP && smtpUser && smtpPass) {
            // Gmail SMTP configuration
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: smtpUser,
                    pass: smtpPass // App password for Gmail
                }
            });
            this.fromEmail = smtpUser;
            this.isConfigured = true;
            console.log('✅ Gmail SMTP Email Service initialized');
        } else if (smtpHost && smtpPort && smtpUser && smtpPass) {
            // Custom SMTP configuration
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort),
                secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });
            this.isConfigured = true;
            console.log('✅ Custom SMTP Email Service initialized');
        } else {
            console.warn('⚠️  SMTP credentials not found. Email sending will be simulated.');
            this.isConfigured = false;
        }
    }

    /**
     * Send a single email via SMTP
     */
    async sendEmail(params: SendEmailParams): Promise<EmailResult> {
        const recipient = Array.isArray(params.to) ? params.to[0] : params.to;

        try {
            // If not configured, simulate sending
            if (!this.isConfigured || !this.transporter) {
                console.log('📧 [SIMULATED] Sending email to:', recipient);
                console.log('   Subject:', params.subject);
                console.log('   Content:', params.text?.substring(0, 100) + '...');

                // Save to database even in simulation mode
                if (params.userId) {
                    await this.saveEmailToDatabase({
                        ...params,
                        to: recipient,
                        messageId: `simulated-${Date.now()}`,
                        success: true
                    });
                }

                return {
                    success: true,
                    messageId: `simulated-${Date.now()}`,
                    recipient
                };
            }

            // Send email via SMTP
            const mailOptions = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: recipient,
                subject: params.subject,
                text: params.text,
                html: params.html || params.text?.replace(/\n/g, '<br>'),
                attachments: params.attachments
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Email sent successfully to:', recipient);
            console.log('   Message ID:', info.messageId);

            // Save to database
            let savedEmail = null;
            if (params.userId) {
                savedEmail = await this.saveEmailToDatabase({
                    ...params,
                    to: recipient,
                    messageId: info.messageId,
                    success: true
                });
            }

            return {
                success: true,
                messageId: info.messageId,
                emailId: savedEmail?._id?.toString(),
                recipient
            };
        } catch (error) {
            console.error('❌ Email sending error to', recipient, ':', error);

            // Save failed email to database
            if (params.userId) {
                await this.saveEmailToDatabase({
                    ...params,
                    to: recipient,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                recipient
            };
        }
    }

    /**
     * Send bulk emails with batching (limit 50 per batch)
     */
    async sendBulkEmails(
        recipients: string[],
        subject: string,
        text?: string,
        html?: string,
        attachments?: EmailAttachment[],
        userId?: mongoose.Types.ObjectId,
        spaceId?: mongoose.Types.ObjectId
    ): Promise<EmailResult[]> {
        const BATCH_SIZE = 50;
        const results: EmailResult[] = [];

        // Process in batches
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            console.log(`📧 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(recipients.length / BATCH_SIZE)}`);

            // Send emails in parallel within the batch
            const batchPromises = batch.map(recipient =>
                this.sendEmail({
                    to: recipient,
                    subject,
                    text,
                    html,
                    attachments,
                    userId,
                    spaceId
                })
            );

            const batchResults = await Promise.allSettled(batchPromises);

            // Collect results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        success: false,
                        error: result.reason?.message || 'Unknown error',
                        recipient: batch[index]
                    });
                }
            });

            // Add delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Save email to database
     */
    private async saveEmailToDatabase(params: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
        messageId?: string;
        success: boolean;
        error?: string;
        userId?: mongoose.Types.ObjectId;
        spaceId?: mongoose.Types.ObjectId;
        vendorId?: mongoose.Types.ObjectId;  // Added for vendor tracking
    }): Promise<IEmail | null> {
        try {
            if (!params.userId) return null;

            const email = await Email.create({
                userId: params.userId,
                spaceId: params.spaceId,
                vendorId: params.vendorId,  // Added for vendor tracking
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                to: [{
                    email: params.to
                }],
                subject: params.subject,
                bodyPlain: params.text,
                bodyHtml: params.html,
                messageId: params.messageId,
                direction: 'outbound',
                provider: 'smtp',
                deliveryStatus: params.success ? 'sent' : 'failed',
                deliveryError: params.error,
                processed: true,
                receivedAt: new Date()
            });

            return email;
        } catch (error) {
            console.error('Failed to save email to database:', error);
            return null;
        }
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection(): Promise<{ success: boolean; error?: string }> {
        if (!this.isConfigured || !this.transporter) {
            return {
                success: false,
                error: 'SMTP not configured'
            };
        }

        try {
            await this.transporter.verify();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

export const smtpEmailService = new SMTPEmailService();
