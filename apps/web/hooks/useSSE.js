'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Opens a Server-Sent Events connection and tracks its lifecycle.
 *
 * EventSource handles reconnection automatically on network drops. This hook
 * surfaces the connection status so the UI can show a live indicator, and
 * calls `onMessage` for every incoming event.
 *
 * Supported event types:
 *   - 'webhook'      — a new request was received on the endpoint
 *   - 'rate_limited' — an IP was blocked by the rate limiter on this endpoint
 *
 * @param {string|null} url - Full SSE endpoint URL. Pass null to disable.
 * @param {function(string, any): void} onMessage - Called with (eventType, parsedData) for each event
 * @returns {{ status: 'connecting'|'connected'|'reconnecting' }}
 */
export function useSSE(url, onMessage) {
    const [status, setStatus] = useState('connecting');
    // Keep a stable ref to the callback so the effect doesn't re-run when the
    // parent component re-renders with a new inline function reference.
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        if (!url) return;

        const source = new EventSource(url);

        source.addEventListener('connected', () => {
            setStatus('connected');
        });

        source.addEventListener('webhook', (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current('webhook', data);
            } catch {
                // Malformed SSE data — skip silently rather than crashing the UI
            }
        });

        source.addEventListener('rate_limited', (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current('rate_limited', data);
            } catch {
                // Malformed SSE data — skip silently rather than crashing the UI
            }
        });

        // The browser marks EventSource as CLOSED on error and retries automatically.
        // We reflect this as 'reconnecting' until the 'connected' event fires again.
        source.onerror = () => {
            setStatus('reconnecting');
        };

        return () => {
            source.close();
        };
    }, [url]);

    return { status };
}
