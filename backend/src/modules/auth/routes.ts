import { Router } from 'express';
import { validateResource } from '../../common/middlewares/validateResource';
import { authenticate } from '../../common/middlewares/authenticate';
import { registerSchema, loginSchema, changePasswordSchema } from './schema';
import {
    registerHandler,
    loginHandler,
    logoutHandler,
    getMeHandler,
    changePasswordHandler,
    refreshTokenHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
} from './controller';

const router = Router();

// Public routes
router.post('/register', validateResource(registerSchema), registerHandler);
router.post('/login', validateResource(loginSchema), loginHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

// Protected routes
router.use(authenticate); // All routes below this require authentication

router.get('/me', getMeHandler);
router.post('/logout', logoutHandler);
router.post('/change-password', validateResource(changePasswordSchema), changePasswordHandler);
router.post('/refresh-token', refreshTokenHandler);

export default router;

