import { Router } from 'express';
import * as spaceController from './controller';
import { authenticate } from '../../common/middlewares/authenticate';
import multer from 'multer';
// import { authenticate } from '../../common/middlewares/auth';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// router.use(authenticate);

router.post('/', spaceController.createSpace);
router.get('/', spaceController.getSpaces);
router.get('/:id', spaceController.getSpaceById);
router.put('/:id', spaceController.updateSpace);
router.delete('/:id', spaceController.deleteSpace);

// RFP specific routes within space context
router.post('/:id/parse', spaceController.parseRequirements);
router.post('/:id/generate-template', spaceController.generateTemplate);

// Vendors matching this space's categories
router.get('/:id/vendors', spaceController.getVendorsForSpace);

// Email statuses for vendors
router.get('/:id/email-statuses', spaceController.getVendorEmailStatuses);

// Send RFP to selected vendors (with file upload support)
router.post('/:id/send-rfp', authenticate, upload.array('attachments', 10), spaceController.sendRFPToVendors);

// Compare proposals  
router.get('/:id/proposals/compare', spaceController.compareProposals);

// Import manual email
router.post('/:id/import-email', spaceController.importManualEmail);

export default router;
