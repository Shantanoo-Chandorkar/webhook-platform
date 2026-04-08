import mongoose from "mongoose";
import Redis from "ioredis";

let redis;

function getRedis() {
    if(!redis) {
        redis = new Redis(process.env.REDIS_URL);
    }
    return redis;
}

export async function GET() {
    const health = {
        status: 'ok',
        mongodb: 'disconnected',
        redis: 'disconnected'
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
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