/**
 * Thin fetch wrappers for every API route.
 *
 * All functions read NEXT_PUBLIC_API_URL as the base URL, throw an Error with
 * the server's `error` message on non-OK responses, and return the parsed
 * JSON body on success.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Shared helper that executes a fetch and normalises error handling.
 *
 * @param {string} path - Path relative to BASE_URL (e.g. "/api/endpoints")
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} With the server's error message if the response is not OK
 */
async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    const json = await response.json();

    if (!response.ok) {
        throw new Error(json.error ?? `Request failed with status ${response.status}`);
    }

    return json;
}

/**
 * Creates a new webhook endpoint.
 *
 * @returns {Promise<{ id: string, slug: string, url: string, defaultReplayUrl: string|null, expiresAt: string }>}
 */
export async function createEndpoint() {
    return request('/api/endpoints', { method: 'POST' });
}

/**
 * Fetches metadata for an existing endpoint by its slug.
 *
 * @param {string} slug - The 8-character endpoint slug
 * @returns {Promise<{ id: string, slug: string, url: string, defaultReplayUrl: string|null, createdAt: string, expiresAt: string }>}
 */
export async function getEndpoint(slug) {
    return request(`/api/endpoints/${slug}`);
}

/**
 * Updates an endpoint's defaultReplayUrl.
 *
 * @param {string} slug - The 8-character endpoint slug
 * @param {{ defaultReplayUrl: string }} payload
 * @returns {Promise<{ id: string, slug: string, url: string, defaultReplayUrl: string|null, createdAt: string, expiresAt: string }>}
 */
export async function patchEndpoint(slug, payload) {
    return request(`/api/endpoints/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetches a paginated list of requests for an endpoint.
 *
 * @param {string} slug - The 8-character endpoint slug
 * @param {number} page - 1-based page number
 * @param {number} limit - Number of items per page
 * @returns {Promise<{ requests: Array, totalCount: number, totalPages: number, page: number }>}
 */
export async function getRequests(slug, page = 1, limit = 100) {
    return request(`/api/endpoints/${slug}/requests?page=${page}&limit=${limit}`);
}

/**
 * Fetches full detail for a single request including its replay history.
 *
 * @param {string} requestId - MongoDB ObjectId of the request
 * @returns {Promise<{ id: string, method: string, headers: object, body: string|null, query: object, sourceIp: string, receivedAt: string, replays: Array }>}
 */
export async function getRequest(requestId) {
    return request(`/api/requests/${requestId}`);
}

/**
 * Deletes a request and its associated replays.
 *
 * @param {string} requestId - MongoDB ObjectId of the request
 * @returns {Promise<{ deleted: true }>}
 */
export async function deleteRequest(requestId) {
    return request(`/api/requests/${requestId}`, { method: 'DELETE' });
}

/**
 * Replays a stored request to a target URL.
 *
 * @param {string} requestId - MongoDB ObjectId of the request
 * @param {string} targetUrl - URL to replay the request against
 * @returns {Promise<{ responseStatus: number, responseBody: string, success: boolean, errorMessage: string|null }>}
 */
export async function replayRequest(requestId, targetUrl) {
    return request(`/api/requests/${requestId}/replay`, {
        method: 'POST',
        body: JSON.stringify({ targetUrl }),
    });
}
