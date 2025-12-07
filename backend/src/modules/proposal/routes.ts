import { Router } from 'express';
import * as proposalController from './controller';

const router = Router();

router.post('/', proposalController.createProposal);
router.get('/', proposalController.getProposals);
router.get('/:id', proposalController.getProposalById);
router.post('/:id/parse', proposalController.parseProposal);
router.patch('/:id/status', proposalController.updateProposalStatus);

export default router;
