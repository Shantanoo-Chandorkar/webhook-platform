import { NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';

/**
 * Adds CORS headers to every API and webhook receiver response.
 *
 * The web app (apps/web) is a separate origin, so the browser sends an OPTIONS
 * preflight before any cross-origin POST/PATCH/DELETE. This proxy returns the
 * correct preflight response and injects CORS headers into all other responses.
 *
 * Allowed origins are read from the ALLOWED_ORIGINS environment variable — see
 * lib/cors.js. Origins that are not in the list receive no allow-origin header
 * and are blocked by the browser's same-origin policy.
 *
 * The SSE stream route sets its own CORS headers directly on its streaming
 * Response, since the proxy layer cannot reliably modify headers on a response
 * that has already started streaming. It uses the same buildCorsHeaders utility
 * to stay consistent with this policy.
 */
export function proxy(request) {
    const origin = request.headers.get('origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin);

    // Respond to OPTIONS preflights immediately — no need to hit the route handler
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}

export const config = {
    matcher: ['/api/:path*', '/hook/:path*'],
};
