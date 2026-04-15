import crypto from "crypto";

import { connectDB } from "@/services/dbService";
import Endpoint from "@/models/Endpoint";

export async function POST() {
    try {
        await connectDB();
    } catch (err) {
        return Response.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }

    // Generate a URL-safe UUIDv4 slug (first 8 chars for brevity)
    const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    try {
        const endpoint = await Endpoint.create({ slug });

        return Response.json(
            {
                id: endpoint._id,
                slug: endpoint.slug,
                url: `${process.env.NEXT_PUBLIC_API_URL}/hook/${endpoint.slug}`,
                defaultReplayUrl: endpoint.defaultReplayUrl,
                expiresAt: endpoint.expiresAt,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Endpoint creation failed:", err.message);
        return Response.json(
            { error: "Failed to create endpoint" },
            { status: 500 }
        );
    }
}
