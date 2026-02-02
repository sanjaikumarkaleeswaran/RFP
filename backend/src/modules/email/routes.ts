import { Router } from 'express';
import * as emailController from './controller';
import { fixInboundVendorIds } from './fix-vendor-ids.controller';
import { authenticate } from '../../common/middlewares/authenticate';

const router = Router();

// Original email routes
router.post('/import', emailController.importEmail);
router.get('/', emailController.getEmails);
router.get('/:id', emailController.getEmailById);
router.post('/:id/attach', emailController.attachToSpace);

// ==================== SMTP EMAIL ROUTES ====================
router.post('/send', emailController.sendEmail);
router.post('/bulk', emailController.sendBulkEmails);
router.get('/smtp/verify', emailController.verifySMTP);

// ==================== GMAIL API ROUTES ====================
router.get('/gmail/auth-url', authenticate, emailController.getGmailAuthUrl);
router.get('/gmail/oauth/callback', emailController.handleGmailCallback);
router.get('/gmail/inbox', authenticate, emailController.getGmailInbox);
router.post('/gmail/check-replies', emailController.checkGmailReplies);
router.post('/check-replies', authenticate, emailController.checkGmailRepliesNow); // Alias for frontend
router.post('/gmail/send', authenticate, emailController.sendViaGmail);
router.get('/gmail/status', authenticate, emailController.getGmailStatus);
router.post('/gmail/disconnect', authenticate, emailController.disconnectGmail);
router.get('/vendor/:vendorId', authenticate, emailController.getVendorEmails); // Get emails for vendor

// ==================== GMAIL WATCH ROUTES (Polling) ====================
router.post('/gmail/watch/start', emailController.startGmailWatch);
router.post('/gmail/watch/stop', emailController.stopGmailWatch);
router.post('/gmail/watch/check', emailController.checkGmailRepliesNow);

// ==================== GMAIL WEBHOOK ROUTES (Push Notifications) ====================
router.post('/gmail/webhook/start', authenticate, emailController.startGmailWebhook);
router.post('/gmail/webhook/stop', authenticate, emailController.stopGmailWebhook);
router.post('/gmail/webhook/renew', authenticate, emailController.renewGmailWebhook);
router.post('/gmail/webhook/notifications', emailController.handleGmailWebhook); // Called by Google Pub/Sub


// ==================== EMAIL MANAGEMENT ROUTES ====================
router.get('/replies', emailController.getReplies);
router.get('/sent', emailController.getSentEmails);

// ==================== EMAIL THREADING ROUTES ====================
router.get('/threads', emailController.getAllThreads);
router.get('/threads/stats', emailController.getThreadStats);
router.get('/:id/thread', emailController.getEmailThread);

// ==================== INBOX ROUTES ====================
router.get('/inbox', authenticate, emailController.getInbox);
router.post('/:id/import', authenticate, emailController.importEmailToSpace);
router.post('/:id/map-vendor', emailController.mapEmailToVendor);
router.get('/imported/:spaceId', authenticate, emailController.getImportedEmails);
router.get('/imported/count/:spaceId', authenticate, emailController.getImportedEmailsCount);
router.patch('/:id/mark-read', authenticate, emailController.markEmailAsRead);

// ==================== DEBUG ROUTES ====================
router.get('/debug/sent', authenticate, emailController.debugSentEmails);
// TODO: Fix this route - causing "Route handler must be a function" error
// router.post('/fix-vendor-ids', authenticate, fixInboundVendorIds); // Fix missing vendorIds

// ==================== ATTACHMENT ROUTES ====================
router.get('/:emailId/attachments/:attachmentId/download', authenticate, emailController.downloadAttachment);
router.get('/:emailId/attachments/:attachmentId/preview', authenticate, emailController.previewAttachment);

export default router;

