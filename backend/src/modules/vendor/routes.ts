import { Router } from 'express';
import * as vendorController from './controller';
// import { authenticate } from '../../common/middlewares/auth'; // Assuming auth middleware exists

const router = Router();

// router.use(authenticate); // Protect all vendor routes

router.post('/', vendorController.createVendor);
router.get('/search', vendorController.searchVendors);
router.get('/', vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

export default router;
