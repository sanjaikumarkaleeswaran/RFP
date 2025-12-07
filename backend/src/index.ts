import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Start Gmail webhook for all connected accounts (Push Notifications)
        try {
            const { gmailWebhookService } = await import('./common/services/gmail-webhook.service');
            await gmailWebhookService.startWatchingAllUsers();
            console.log('✅ Gmail webhook service initialized');
        } catch (error) {
            console.error('⚠️  Gmail webhook service failed to initialize:', error);
        }

        // FALLBACK: Start Gmail watch service (Polling) for local development
        // This ensures emails are detected even if Pub/Sub webhooks are not configured
        try {
            const { gmailWatchService } = await import('./common/services/gmail-watch.service');
            await gmailWatchService.startWatchingAllUsers(30); // Check every 30 seconds
            console.log('✅ Gmail watch service (polling) initialized');
        } catch (error) {
            console.error('⚠️  Gmail watch service failed to initialize:', error);
        }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });


