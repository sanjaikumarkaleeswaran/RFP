import { Router, Request, Response } from 'express';
import { Email } from '../email/model';
import crypto from 'crypto';

const router = Router();

/**
 * Resend Webhook Handler for Email Replies
 * 
 * Resend will send a POST request to this endpoint when:
 * - An email is delivered
 * - An email bounces
 * - Someone replies to your email
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/resend
 */
router.post('/resend', async (req: Request, res: Response) => {
    try {
        console.log('📬 Resend Webhook Received');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));

        // Verify webhook signature (optional but recommended for production)
        const signature = req.headers['resend-signature'] as string;
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

        if (webhookSecret && signature) {
            const isValid = verifyWebhookSignature(
                JSON.stringify(req.body),
                signature,
                webhookSecret
            );

            if (!isValid) {
                console.error('❌ Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const event = req.body;
        const eventType = event.type;

        console.log(`📧 Event Type: ${eventType}`);

        // Handle different event types
        switch (eventType) {
            case 'email.sent':
                await handleEmailSent(event);
                break;

            case 'email.delivered':
                await handleEmailDelivered(event);
                break;

            case 'email.delivery_delayed':
                await handleEmailDelayed(event);
                break;

            case 'email.bounced':
                await handleEmailBounced(event);
                break;

            case 'email.complained':
                await handleEmailComplained(event);
                break;

            case 'email.opened':
                await handleEmailOpened(event);
                break;

            case 'email.clicked':
                await handleEmailClicked(event);
                break;

            // IMPORTANT: Reply detection
            case 'email.replied':
                await handleEmailReply(event);
                break;

            default:
                console.log(`⚠️  Unhandled event type: ${eventType}`);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle email sent event
 */
async function handleEmailSent(event: any) {
    console.log('✅ Email sent:', event.data.email_id);

    // Update email status in database
    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            deliveryStatus: 'sent',
            $push: {
                events: {
                    type: 'sent',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email delivered event
 */
async function handleEmailDelivered(event: any) {
    console.log('✅ Email delivered:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            deliveryStatus: 'delivered',
            deliveredAt: new Date(event.created_at),
            $push: {
                events: {
                    type: 'delivered',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email delayed event
 */
async function handleEmailDelayed(event: any) {
    console.log('⏳ Email delayed:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            deliveryStatus: 'delayed',
            $push: {
                events: {
                    type: 'delayed',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email bounced event
 */
async function handleEmailBounced(event: any) {
    console.log('❌ Email bounced:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            deliveryStatus: 'bounced',
            deliveryError: event.data.bounce?.message || 'Email bounced',
            $push: {
                events: {
                    type: 'bounced',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email complained event (spam report)
 */
async function handleEmailComplained(event: any) {
    console.log('⚠️  Email complained:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            deliveryStatus: 'complained',
            $push: {
                events: {
                    type: 'complained',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email opened event
 */
async function handleEmailOpened(event: any) {
    console.log('👁️  Email opened:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            openedAt: new Date(event.created_at),
            $push: {
                events: {
                    type: 'opened',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email clicked event
 */
async function handleEmailClicked(event: any) {
    console.log('🖱️  Email link clicked:', event.data.email_id);

    await Email.findOneAndUpdate(
        { messageId: event.data.email_id },
        {
            $push: {
                events: {
                    type: 'clicked',
                    timestamp: new Date(event.created_at),
                    data: event.data
                }
            }
        }
    );
}

/**
 * Handle email reply event - MAIN FEATURE
 */
async function handleEmailReply(event: any) {
    console.log('💬 EMAIL REPLY RECEIVED!');
    console.log('Reply Data:', JSON.stringify(event.data, null, 2));

    const replyData = event.data;

    // Find the original email that was replied to
    const originalEmail = await Email.findOne({
        messageId: replyData.in_reply_to || replyData.email_id
    });

    if (!originalEmail) {
        console.warn('⚠️  Original email not found for reply');
    }

    // Create new email document for the reply
    const replyEmail = await Email.create({
        userId: originalEmail?.userId,
        spaceId: originalEmail?.spaceId,
        from: {
            email: replyData.from?.email || replyData.from,
            name: replyData.from?.name || replyData.from
        },
        to: [{
            email: replyData.to?.email || replyData.to,
            name: replyData.to?.name || replyData.to
        }],
        subject: replyData.subject,
        bodyPlain: replyData.text || replyData.body_plain,
        bodyHtml: replyData.html || replyData.body_html,
        messageId: replyData.message_id || replyData.email_id,
        inReplyTo: replyData.in_reply_to,
        references: replyData.references ? replyData.references.split(' ') : [],
        threadId: replyData.thread_id,
        direction: 'inbound',
        provider: 'resend',
        deliveryStatus: 'delivered',
        receivedAt: new Date(event.created_at),
        processed: true,
        isReply: true,
        originalEmailId: originalEmail?._id,
        events: [{
            type: 'reply_received',
            timestamp: new Date(event.created_at),
            data: replyData
        }]
    });

    console.log('✅ Reply saved to database!');
    console.log('Reply ID:', replyEmail._id);
    console.log('From:', replyEmail.from.email);
    console.log('Subject:', replyEmail.subject);
    console.log('Body Preview:', replyEmail.bodyPlain?.substring(0, 100) + '...');

    // Update original email to mark it as replied
    if (originalEmail) {
        await Email.findByIdAndUpdate(originalEmail._id, {
            hasReply: true,
            repliedAt: new Date(event.created_at)
        });
    }

    return replyEmail;
}

/**
 * Verify webhook signature from Resend
 */
function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    try {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(payload).digest('hex');
        return digest === signature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Test endpoint to simulate webhook (for development)
 */
router.post('/resend/test', async (req: Request, res: Response) => {
    console.log('🧪 Test webhook triggered');

    const testReplyEvent = {
        type: 'email.replied',
        created_at: new Date().toISOString(),
        data: {
            email_id: 'test-reply-' + Date.now(),
            message_id: '<test-reply@resend.dev>',
            from: {
                email: 'vendor@example.com',
                name: 'Test Vendor'
            },
            to: {
                email: 'you@example.com',
                name: 'You'
            },
            subject: 'Re: RFP Request',
            text: 'Thank you for your RFP request. We would be happy to provide a quote.',
            html: '<p>Thank you for your RFP request. We would be happy to provide a quote.</p>',
            in_reply_to: req.body.originalMessageId || '<original@resend.dev>',
            thread_id: 'thread-123',
            references: '<original@resend.dev>'
        }
    };

    await handleEmailReply(testReplyEvent);

    res.json({
        success: true,
        message: 'Test reply processed',
        event: testReplyEvent
    });
});

export default router;
