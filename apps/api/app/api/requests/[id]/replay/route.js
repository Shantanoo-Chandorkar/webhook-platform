import { connectDB } from '@/services/dbService';
import WebhookRequest from '@/models/WebhookRequest';
import WebhookReplay from '@/models/WebhookReplay';

/**
 * Replay engine — re-sends a stored webhook request to a user-supplied target URL.
 * Expects JSON body: { targetUrl: string }
 */
export async function POST(request, { params }) {
    const { id: requestId } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const original = await WebhookRequest.findById(requestId);
    if (!original) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    let targetUrl;
    try {
        const body = await request.json();
        targetUrl = body.targetUrl;
    } catch {
        return Response.json(
            { error: 'Invalid request body. Expected { targetUrl: string }' },
            { status: 400 },
        );
    }

    if (!targetUrl) {
        return Response.json({ error: 'targetUrl is required' }, { status: 400 });
    }

    // Validate URL format
    try {
        new URL(targetUrl);
    } catch {
        return Response.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Build the outbound request using the original method, headers, and body
    const outgoingHeaders = new Headers();

    // Copy original headers, rewriting Host to the target's host
    const targetHost = new URL(targetUrl).host;
    for (const [key, value] of Object.entries(original.headers)) {
        if (key.toLowerCase() === 'host') continue; // Skip original Host header
        outgoingHeaders.set(key, value);
    }
    outgoingHeaders.set('Host', targetHost);

    const replayRecord = {
        requestId: original._id,
        targetUrl,
        requestMethod: original.method,
        requestHeaders: Object.fromEntries(outgoingHeaders.entries()),
        requestBody: original.body,
    };

    try {
        const response = await fetch(targetUrl, {
            method: original.method,
            headers: outgoingHeaders,
            body: original.body || undefined,
            // Timeout after 30 seconds to avoid hanging connections
            signal: AbortSignal.timeout(30_000),
        });

        // Read the response body as text
        let responseBody;
        try {
            responseBody = await response.text();
        } catch {
            responseBody = '[unable to read response body]';
        }

        // Parse response headers into a plain object for storage
        const responseHeaders = Object.fromEntries(response.headers.entries());

        replayRecord.responseStatus = response.status;
        replayRecord.responseHeaders = responseHeaders;
        replayRecord.responseBody = responseBody;
        replayRecord.success = response.ok;
        replayRecord.errorMessage = null;
    } catch (err) {
        // Network-level failures (DNS, connection refused, timeout, etc.)
        replayRecord.responseStatus = 0;
        replayRecord.responseHeaders = {};
        replayRecord.responseBody = null;
        replayRecord.success = false;
        replayRecord.errorMessage = err.message;
    }

    const replay = await WebhookReplay.create(replayRecord);

    return Response.json({
        id: replay._id,
        targetUrl: replay.targetUrl,
        replayedAt: replay.replayedAt,
        requestMethod: replay.requestMethod,
        responseStatus: replay.responseStatus,
        responseHeaders: replay.responseHeaders,
        responseBody: replay.responseBody,
        success: replay.success,
        errorMessage: replay.errorMessage,
    });
}
