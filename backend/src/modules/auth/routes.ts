import { Router } from 'express';
import { validateResource } from '../../common/middlewares/validateResource';
import { authenticate } from '../../common/middlewares/authenticate';
import { registerSchema, loginSchema } from './schema';
import {
    registerHandler,
    loginHandler,
    logoutHandler,
    getMeHandler,
} from './controller';

const router = Router();

router.post('/register', validateResource(registerSchema), registerHandler);
router.post('/login', validateResource(loginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
