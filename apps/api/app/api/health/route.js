import mongoose from 'mongoose';

import { connectDB } from '@/services/dbService';
import { getRedis } from '@/services/redisService';

export async function GET() {
    const health = {
        status: 'ok',
        mongodb: 'disconnected',
        redis: 'disconnected',
    };

    try {
        await connectDB();
        health.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (err) {
        health.mongodb = 'error';
        health.status = 'degraded';
    }

    try {
        const client = getRedis();
        await client.ping();
        health.redis = 'connected';
    } catch (error) {
        health.redis = 'error';
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return Response.json(health, { status: statusCode });
}
