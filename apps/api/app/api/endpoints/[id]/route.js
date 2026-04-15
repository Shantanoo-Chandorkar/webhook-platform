import { connectDB } from "@/services/dbService";
import Endpoint from "@/models/Endpoint";

/**
 * Returns endpoint metadata including slug, default replay URL, and expiry.
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

    const endpoint = await Endpoint.findOne({ slug }).lean();
    if (!endpoint) {
        return Response.json({ error: "Endpoint not found" }, { status: 404 });
    }

    return Response.json({
        id: endpoint._id.toString(),
        slug: endpoint.slug,
        url: `${process.env.NEXT_PUBLIC_API_URL}/hook/${endpoint.slug}`,
        defaultReplayUrl: endpoint.defaultReplayUrl,
        createdAt: endpoint.createdAt,
        expiresAt: endpoint.expiresAt,
    });
}

/**
 * Updates the default replay URL for an endpoint.
 * Expects JSON body: { defaultReplayUrl: string }
 */
export async function PATCH(request, { params }) {
    const { id: slug } = await params;

    try {
        await connectDB();
    } catch {
        return Response.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }

    let defaultReplayUrl;
    try {
        const body = await request.json();
        defaultReplayUrl = body.defaultReplayUrl;
    } catch {
        return Response.json(
            { error: "Invalid request body. Expected { defaultReplayUrl: string }" },
            { status: 400 }
        );
    }

    if (!defaultReplayUrl) {
        return Response.json(
            { error: "defaultReplayUrl is required" },
            { status: 400 }
        );
    }

    // Validate URL format
    try {
        new URL(defaultReplayUrl);
    } catch {
        return Response.json(
            { error: "Invalid URL format" },
            { status: 400 }
        );
    }

    const endpoint = await Endpoint.findOneAndUpdate(
        { slug },
        { defaultReplayUrl },
        { new: true }
    ).lean();

    if (!endpoint) {
        return Response.json({ error: "Endpoint not found" }, { status: 404 });
    }

    return Response.json({
        id: endpoint._id.toString(),
        slug: endpoint.slug,
        url: `${process.env.NEXT_PUBLIC_API_URL}/hook/${endpoint.slug}`,
        defaultReplayUrl: endpoint.defaultReplayUrl,
        createdAt: endpoint.createdAt,
        expiresAt: endpoint.expiresAt,
    });
}
