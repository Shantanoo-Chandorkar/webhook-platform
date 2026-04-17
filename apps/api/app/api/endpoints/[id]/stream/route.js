import { connectDB } from '@/services/dbService';
import { getRedis } from '@/services/redisService';
import Endpoint from '@/models/Endpoint';
import { buildCorsHeaders } from '@/lib/cors';

/**
 * SSE stream endpoint — holds a long-lived connection and pushes
 * new webhook requests to the browser in real-time via Redis pub/sub.
 */
export async function GET(request, { params }) {
    const { id: slug } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const endpoint = await Endpoint.findOne({ slug }).select('_id');
    if (!endpoint) {
        return Response.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const channel = `webhook:${endpoint._id.toString()}`;
    const redis = getRedis();

    // Create a duplicate Redis connection for subscribing (publishing and
    // subscribing cannot share the same connection in Redis).
    const subscriber = redis.duplicate();

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
        start(ctrl) {
            // Listen for pub/sub messages on the Redis channel.
            // Read the event type from the payload so new event types (e.g. rate_limited)
            // are forwarded without changing this handler again.
            subscriber.on('message', (_ch, message) => {
                let eventType = 'webhook';
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.eventType) eventType = parsed.eventType;
                } catch {
                    // Malformed message — fall back to 'webhook'
                }
                const sseData = `event: ${eventType}\ndata: ${message}\n\n`;
                ctrl.enqueue(encoder.encode(sseData));
            });

            // Subscribe to the Redis pub/sub channel for this endpoint
            subscriber.subscribe(channel).catch((err) => {
                console.error('Redis subscribe failed:', err.message);
                ctrl.close();
            });

            // Send initial connection confirmation
            const connectedEvent = `event: connected\ndata: {"status":"connected"}\n\n`;
            ctrl.enqueue(encoder.encode(connectedEvent));
        },
        cancel() {
            // Client disconnected — clean up the Redis subscription
            subscriber.unsubscribe(channel).catch(() => {});
            subscriber.quit().catch(() => {});
        },
    });

    // The proxy layer cannot reliably set headers on a streaming response after
    // it has started, so CORS headers are applied here directly using the same
    // utility as proxy.js to keep the policy consistent across all routes.
    const origin = request.headers.get('origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin);

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
            ...corsHeaders,
        },
    });
}
