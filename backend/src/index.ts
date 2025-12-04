import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import app from './app';

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/nova';
 console.log({PORT,MONGO_URI})
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

