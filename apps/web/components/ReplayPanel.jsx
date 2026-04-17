'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JsonViewer } from '@/components/JsonViewer';
import { patchEndpoint, replayRequest } from '@/lib/api';

/**
 * Replay UI panel rendered inside the Replay tab of RequestDetail.
 *
 * Allows the user to replay a captured request to any target URL, optionally
 * saving that URL as the endpoint's default. Displays the response inline and
 * shows previous replay history from the request object.
 *
 * @param {{
 *   request: object,
 *   endpointSlug: string,
 *   endpointDefaultReplayUrl: string|null,
 *   onReplayUrlSaved: function(string): void
 * }} props
 */
export function ReplayPanel({ request, endpointSlug, endpointDefaultReplayUrl, onReplayUrlSaved }) {
    const [targetUrl, setTargetUrl] = useState(endpointDefaultReplayUrl ?? '');
    const [saveAsDefault, setSaveAsDefault] = useState(false);
    const [isReplaying, setIsReplaying] = useState(false);
    const [result, setResult] = useState(null);
    const [urlError, setUrlError] = useState(null);
    const [replayError, setReplayError] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);

    /**
     * Validates the URL client-side before sending — mirrors the server's own
     * validation so the user gets instant feedback without a round-trip.
     *
     * @returns {boolean}
     */
    function isValidUrl(value) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    async function handleReplay() {
        if (!isValidUrl(targetUrl)) {
            setUrlError('Please enter a valid http:// or https:// URL');
            return;
        }
        setUrlError(null);
        setReplayError(null);
        setIsReplaying(true);
        setResult(null);

        try {
            const replayResult = await replayRequest(request.id, targetUrl);
            setResult(replayResult);

            if (saveAsDefault) {
                try {
                    await patchEndpoint(endpointSlug, { defaultReplayUrl: targetUrl });
                    onReplayUrlSaved(targetUrl);
                    toast.success('Default replay URL saved');
                } catch {
                    toast.error('Failed to save default replay URL');
                }
            }
        } catch (err) {
            setReplayError(err.message);
        } finally {
            setIsReplaying(false);
        }
    }

    const replays = request.replays ?? [];

    return (
        <div className="flex flex-col gap-6">
            {/* Target URL input */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Target URL</label>
                <Input
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={targetUrl}
                    onChange={(e) => {
                        setTargetUrl(e.target.value);
                        setUrlError(null);
                    }}
                    className="font-mono text-sm"
                />
                {urlError && <p className="text-xs text-destructive">{urlError}</p>}

                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="rounded"
                    />
                    Save as default replay URL for this endpoint
                </label>
            </div>

            <Button onClick={handleReplay} disabled={isReplaying || !targetUrl} className="w-fit">
                {isReplaying ? 'Replaying…' : 'Replay Request'}
            </Button>

            {replayError && <p className="text-sm text-destructive">{replayError}</p>}

            {/* Inline result */}
            {result && <ReplayResult result={result} />}

            {/* Previous replay history */}
            {replays.length > 0 && (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setHistoryOpen((o) => !o)}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                        {historyOpen ? '▾' : '▸'} Previous replays ({replays.length})
                    </button>
                    {historyOpen && (
                        <div className="flex flex-col gap-2">
                            {replays.map((replay) => (
                                <div
                                    key={replay.id}
                                    className="px-3 py-2 rounded-md border border-border bg-muted/30 text-xs flex items-center gap-3"
                                >
                                    <StatusBadge
                                        status={replay.responseStatus}
                                        success={replay.success}
                                    />
                                    <span className="font-mono text-muted-foreground truncate flex-1">
                                        {replay.targetUrl}
                                    </span>
                                    <span className="text-muted-foreground shrink-0">
                                        {formatRelative(replay.replayedAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Displays the result of a single replay attempt — status code, headers, and body.
 *
 * @param {{ result: object }} props
 */
function ReplayResult({ result }) {
    const [headersOpen, setHeadersOpen] = useState(false);

    const responseContentType =
        result.responseHeaders?.['content-type'] ?? result.responseHeaders?.['Content-Type'] ?? '';

    return (
        <div className="flex flex-col gap-3 p-4 rounded-md border border-border bg-card">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Response</span>
                <StatusBadge status={result.responseStatus} success={result.success} />
                {!result.success && result.errorMessage && (
                    <span className="text-xs text-destructive">{result.errorMessage}</span>
                )}
            </div>

            {/* Response headers */}
            {result.responseHeaders && Object.keys(result.responseHeaders).length > 0 && (
                <div>
                    <button
                        onClick={() => setHeadersOpen((o) => !o)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {headersOpen ? '▾' : '▸'} Response headers
                    </button>
                    {headersOpen && (
                        <div className="mt-2 overflow-auto rounded-md border border-border max-h-48">
                            <table className="w-full text-xs">
                                <tbody>
                                    {Object.entries(result.responseHeaders).map(([k, v]) => (
                                        <tr
                                            key={k}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-3 py-1.5 font-mono text-muted-foreground w-1/3">
                                                {k}
                                            </td>
                                            <td className="px-3 py-1.5 font-mono text-foreground break-all">
                                                {v}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Response body */}
            {result.responseBody && (
                <JsonViewer body={result.responseBody} contentType={responseContentType} />
            )}
        </div>
    );
}

/**
 * Badge that colours based on HTTP status code range.
 *
 * @param {{ status: number, success: boolean }} props
 */
function StatusBadge({ status, success }) {
    const isSuccess = success && status >= 200 && status < 300;
    return (
        <Badge
            variant="outline"
            className={
                isSuccess
                    ? 'border-transparent bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-mono'
                    : 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-mono'
            }
        >
            {status === 0 ? 'ERR' : status}
        </Badge>
    );
}

/**
 * Converts an ISO timestamp to a human-readable relative string.
 *
 * @param {string} isoString
 * @returns {string}
 */
function formatRelative(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
