import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middlewares/errorHandler';

// Routes
import authRoutes from './modules/auth/routes';
import spaceRoutes from './modules/space/routes';
import vendorRoutes from './modules/vendor/routes';
import emailRoutes from './modules/email/routes';
import proposalRoutes from './modules/proposal/routes';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/proposals', proposalRoutes);

// Error Handler
app.use(errorHandler);

export default app;
