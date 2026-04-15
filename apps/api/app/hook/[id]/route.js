import { connectDB } from "@/services/dbService";
import { getRedis } from "@/services/redisService";
import Endpoint from "@/models/Endpoint";
import WebhookRequest from "@/models/WebhookRequest";

/**
 * Catch-all webhook receiver — accepts ANY HTTP method to /hook/:slug.
 * Stores the full request and always responds 200 OK.
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
        return Response.json(
            { error: "Database connection failed" },
            { status: 200 }
        );
    }

    // Look up the endpoint by its public slug
    const endpoint = await Endpoint.findOne({ slug });
    if (!endpoint) {
        // Still return 200 to avoid sender retry loops
        return Response.json({ accepted: false, reason: "unknown endpoint" }, { status: 200 });
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

    // Extract source IP from common proxy headers or fall back to unknown
    const sourceIp =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";

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
            console.error("Redis publish failed:", err.message);
        }

        return Response.json({ accepted: true }, { status: 200 });
    } catch (err) {
        console.error("Webhook storage failed:", err.message);
        // Still return 200 to prevent sender retries
        return Response.json({ accepted: false, reason: "storage error" }, { status: 200 });
    }
}
