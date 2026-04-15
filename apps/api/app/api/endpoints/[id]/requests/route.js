import { connectDB } from "@/services/dbService";
import Endpoint from "@/models/Endpoint";
import WebhookRequest from "@/models/WebhookRequest";

/**
 * Paginated request history for an endpoint.
 * Query params: page (default 1), limit (default 50, max 100)
 */
export async function GET(request, { params }) {
    const { id: slug } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }

    const endpoint = await Endpoint.findOne({ slug }).select("_id");
    if (!endpoint) {
        return Response.json({ error: "Endpoint not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const total = await WebhookRequest.countDocuments({ endpointId: endpoint._id });
    const requests = await WebhookRequest.find({ endpointId: endpoint._id })
        .select("_id method sourceIp receivedAt")
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return Response.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        requests: requests.map((r) => ({
            id: r._id.toString(),
            method: r.method,
            sourceIp: r.sourceIp,
            receivedAt: r.receivedAt,
        })),
    });
}
