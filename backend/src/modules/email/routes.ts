import { Router } from 'express';
import * as emailController from './controller';

const router = Router();

router.post('/import', emailController.importEmail);
router.get('/', emailController.getEmails);
router.get('/:id', emailController.getEmailById);
router.post('/:id/attach', emailController.attachToSpace);

export default router;
