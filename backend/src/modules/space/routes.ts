import { Router } from 'express';
import * as spaceController from './controller';
// import { authenticate } from '../../common/middlewares/auth';

const router = Router();

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

export default router;
