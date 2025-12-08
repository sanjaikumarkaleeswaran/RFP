import { Router } from 'express';
import * as vendorProposalController from './controller';
import * as testController from './test-controller';
import * as manualController from './manual-controller';
import { authenticate } from '../../common/middlewares/authenticate';

const router = Router();

// ==================== TEST ROUTES ====================
// Test Gemini API connection (no auth required for testing)
router.get('/test/gemini', testController.testGeminiConnection);
router.get('/test/status', testController.getGeminiStatus);

// ==================== MANUAL ANALYSIS ROUTES ====================
// For analyzing existing vendor replies that weren't auto-analyzed
router.post('/manual/analyze', authenticate, manualController.manuallyAnalyzeReply);
router.get('/manual/find-unanalyzed', authenticate, manualController.findUnanalyzedReplies);
router.post('/manual/batch-analyze', authenticate, manualController.batchAnalyzeReplies);

// ==================== VENDOR PROPOSAL ROUTES ====================
// Analyze vendor reply
router.post('/analyze', authenticate, vendorProposalController.analyzeVendorReply);

// Get proposals for a space
router.get('/space/:spaceId', authenticate, vendorProposalController.getProposalsBySpace);

// Compare proposals for a space
router.post('/space/:spaceId/compare', authenticate, vendorProposalController.compareProposals);

// Get proposal by vendor and space
router.get('/space/:spaceId/vendor/:vendorId', authenticate, vendorProposalController.getProposalByVendor);

// Accept proposal
router.post('/:proposalId/accept', authenticate, vendorProposalController.acceptProposal);

// Reject proposal
router.post('/:proposalId/reject', authenticate, vendorProposalController.rejectProposal);

export default router;
