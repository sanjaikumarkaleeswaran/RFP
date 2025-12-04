import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import { errorHandler } from './common/middlewares/errorHandler';
import { AppError } from './common/utils/AppError';

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Nova Backend is running');
});

// Routes
app.use('/api/auth', authRoutes);

// Handle unhandled routes
app.all('*', (req: Request, res: Response, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
