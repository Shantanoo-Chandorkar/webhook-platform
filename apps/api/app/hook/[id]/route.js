import { connectDB } from '@/services/dbService';
import { getRedis } from '@/services/redisService';
import { checkRateLimit } from '@/services/rateLimitService';
import Endpoint from '@/models/Endpoint';
import WebhookRequest from '@/models/WebhookRequest';

/**
 * Catch-all webhook receiver — accepts ANY HTTP method to /hook/:slug.
 * Returns 200 on success, 410 if the endpoint is unknown or expired,
 * 429 on rate limit, and 500 on infrastructure failure.
 */
export async function POST(request, { params }) {
    return handleWebhook(request, params);
}

export async function GET(request, { params }) {
    return handleWebhook(request, params);
}

export async function PUT(request, { params }) {
    return handleWebhook(request, params);
}

export async function PATCH(request, { params }) {
    return handleWebhook(request, params);
}

export async function DELETE(request, { params }) {
    return handleWebhook(request, params);
}

export async function HEAD(request, { params }) {
    return handleWebhook(request, params);
}

export async function OPTIONS(request, { params }) {
    return handleWebhook(request, params);
}

async function handleWebhook(request, params) {
    const { id: slug } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Look up the endpoint by its public slug
    const endpoint = await Endpoint.findOne({ slug });
    if (!endpoint) {
        // 410 Gone — endpoint does not exist or has expired; signals permanent unavailability
        return Response.json({ accepted: false, reason: 'unknown endpoint' }, { status: 410 });
    }

    // Extract source IP before rate limiting — same logic used later for storage
    const sourceIp =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Enforce per-IP per-endpoint rate limit before touching the database.
    // Scoped per endpoint so a banned IP on one endpoint is not affected on others.
    try {
        const { allowed } = await checkRateLimit(sourceIp, endpoint._id.toString());
        if (!allowed) {
            // Notify the dashboard in real-time that this IP is being rate limited.
            // Failure here must not affect the 429 response — the block is already enforced.
            try {
                const redis = getRedis();
                const channel = `webhook:${endpoint._id.toString()}`;
                await redis.publish(
                    channel,
                    JSON.stringify({
                        eventType: 'rate_limited',
                        ip: sourceIp,
                        retryAfter: 3600,
                        blockedAt: new Date().toISOString(),
                    }),
                );
            } catch (err) {
                console.error('Rate limit Redis publish failed:', err.message);
            }
            return Response.json(
                { error: 'Rate limit exceeded. This IP has been blocked for 1 hour.' },
                {
                    status: 429,
                    headers: { 'Retry-After': '3600' },
                },
            );
        }
    } catch (err) {
        // Rate limit check failure should not block legitimate webhooks —
        // log and allow through rather than dropping requests silently
        console.error('Rate limit check failed:', err.message);
    }

    // Capture all request details
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());

    // Read the raw body as text
    let rawBody = null;
    try {
        rawBody = await request.text();
    } catch {
        // Body may be empty or unreadable
    }

    try {
        const webhookReq = await WebhookRequest.create({
            endpointId: endpoint._id,
            method,
            headers: headers,
            body: rawBody,
            query: query,
            sourceIp,
        });

        // Publish to Redis pub/sub for real-time SSE delivery.
        // Normalise the payload to match the contract used by all other API routes
        // (_id → id, Maps → plain objects, internal fields omitted).
        try {
            const redis = getRedis();
            const channel = `webhook:${endpoint._id.toString()}`;
            const ssePayload = {
                eventType: 'webhook',
                id: webhookReq._id.toString(),
                method: webhookReq.method,
                headers: Object.fromEntries(webhookReq.headers),
                body: webhookReq.body,
                query: Object.fromEntries(webhookReq.query),
                sourceIp: webhookReq.sourceIp,
                receivedAt: webhookReq.receivedAt,
            };
            await redis.publish(channel, JSON.stringify(ssePayload));
        } catch (err) {
            // Redis publish failure should not break the receiver — the request is already in MongoDB
            console.error('Redis publish failed:', err.message);
        }

        return Response.json({ accepted: true }, { status: 200 });
    } catch (err) {
        console.error('Webhook storage failed:', err.message);
        // 500 — webhook could not be persisted; sender may retry
        return Response.json({ accepted: false, reason: 'storage error' }, { status: 500 });
    }
}
