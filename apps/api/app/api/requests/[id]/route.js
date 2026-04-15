import { connectDB } from "@/services/dbService";
import WebhookRequest from "@/models/WebhookRequest";
import WebhookReplay from "@/models/WebhookReplay";

/**
 * Returns full details of a single captured webhook request, including
 * any replay records associated with it.
 */
export async function GET(request, { params }) {
    const { id: requestId } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }

    const webhookReq = await WebhookRequest.findById(requestId).lean();
    if (!webhookReq) {
        return Response.json({ error: "Request not found" }, { status: 404 });
    }

    // Fetch any replays associated with this request
    const replays = await WebhookReplay.find({ requestId }).sort({ replayedAt: -1 }).lean();

    return Response.json({
        id: webhookReq._id.toString(),
        endpointId: webhookReq.endpointId.toString(),
        method: webhookReq.method,
        headers: webhookReq.headers,
        body: webhookReq.body,
        query: webhookReq.query,
        sourceIp: webhookReq.sourceIp,
        receivedAt: webhookReq.receivedAt,
        replays: replays.map((r) => ({
            id: r._id.toString(),
            targetUrl: r.targetUrl,
            replayedAt: r.replayedAt,
            requestMethod: r.requestMethod,
            responseStatus: r.responseStatus,
            responseHeaders: r.responseHeaders,
            responseBody: r.responseBody,
            success: r.success,
            errorMessage: r.errorMessage,
        })),
    });
}

/**
 * Deletes a captured webhook request and all associated replays.
 */
export async function DELETE(request, { params }) {
    const { id: requestId } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }

    const deleted = await WebhookRequest.findByIdAndDelete(requestId);
    if (!deleted) {
        return Response.json({ error: "Request not found" }, { status: 404 });
    }

    // Cascade delete: remove all replays for this request
    await WebhookReplay.deleteMany({ requestId });

    return Response.json({ deleted: true });
}
