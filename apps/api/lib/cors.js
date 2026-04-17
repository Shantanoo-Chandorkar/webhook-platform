/**
 * Shared CORS utilities used by both proxy.js (for standard routes) and any
 * route handler that returns a streaming response (like SSE), where the proxy
 * layer cannot reliably inject headers after the stream has started.
 *
 * Allowed origins are driven entirely by the ALLOWED_ORIGINS environment
 * variable — a comma-separated list of origins permitted to call this API.
 * This makes the policy explicit and environment-specific rather than using
 * a wildcard (*) that would permit any origin in production.
 *
 * Example:
 *   ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com
 */

/**
 * Parses the ALLOWED_ORIGINS environment variable into an array of origin strings.
 *
 * @returns {string[]} List of permitted origins (e.g. ["https://app.example.com"])
 */
export function getAllowedOrigins() {
    const raw = process.env.ALLOWED_ORIGINS ?? '';
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

/**
 * Builds the CORS response headers appropriate for the given request origin.
 *
 * If the request origin is in the allowed list, Access-Control-Allow-Origin is
 * set to that specific origin (not *). If the origin is not allowed, the
 * allow-origin header is omitted entirely — the browser will block the response.
 *
 * @param {string} requestOrigin - The value of the request's Origin header
 * @returns {Record<string, string>} Headers to apply to the response
 */
export function buildCorsHeaders(requestOrigin) {
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = allowedOrigins.includes(requestOrigin);

    return {
        ...(isAllowed && { 'Access-Control-Allow-Origin': requestOrigin }),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}
