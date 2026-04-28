import mongoose from 'mongoose';

let isConnected = false;

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;

/**
 * Connects to MongoDB with retry logic to survive cold starts on Render free tier.
 * On cold start, the service may not be fully ready when the first request arrives,
 * so we retry up to MAX_RETRIES times with linear backoff before giving up.
 */
export async function connectDB() {
    if (isConnected) return;

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set.');
    }

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            isConnected = true;
            return;
        } catch (error) {
            lastError = error;
            console.error(
                `DB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`,
            );

            if (attempt < MAX_RETRIES) {
                const delayMs = RETRY_BACKOFF_MS * attempt;
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}
