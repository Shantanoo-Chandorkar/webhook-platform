'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { MethodBadge } from '@/components/MethodBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

/**
 * Scrollable list of captured webhook requests with client-side pagination
 * and a bulk-delete action.
 *
 * Pagination controls are rendered above the list so the user can navigate
 * without scrolling on a newest-first feed. A banner appears when live
 * requests arrive while the user is on a page other than 1.
 *
 * @param {{
 *   requests: Array,
 *   isLoadingRequests: boolean,
 *   blockedIps: Map<string, { retryAfter: number, blockedAt: string }>,
 *   selectedId: string|null,
 *   onSelect: function(string): void,
 *   displayPage: number,
 *   totalDisplayPages: number,
 *   onPageChange: function(number): void,
 *   newRequestsOnPageOne: boolean,
 *   totalRequestCount: number,
 *   onClearAll: function(): void,
 * }} props
 */
export function RequestList({
    requests,
    isLoadingRequests,
    blockedIps,
    selectedId,
    onSelect,
    displayPage,
    totalDisplayPages,
    onPageChange,
    newRequestsOnPageOne,
    totalRequestCount,
    onClearAll,
}) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header row — pagination controls and clear-all button */}
            <div className="px-3 py-2 border-b border-border shrink-0 flex flex-col gap-1.5">
                {/* Rate limit banner — shown when one or more IPs have been blocked on this endpoint */}
                {blockedIps.size > 0 && (
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                        <p className="font-medium mb-1">Rate limit active</p>
                        {[...blockedIps.entries()].map(([ip, { blockedAt }]) => (
                            <p key={ip} className="font-mono">
                                {ip} — blocked {formatRelative(blockedAt)}
                            </p>
                        ))}
                    </div>
                )}

                {/* Live-request banner — only shown when the user is past page 1 */}
                {newRequestsOnPageOne && (
                    <button
                        onClick={() => onPageChange(1)}
                        className="w-full text-xs text-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded px-2 py-1"
                    >
                        ↑ New requests — go to page 1
                    </button>
                )}

                <div className="flex items-center justify-between">
                    {/* Pagination controls */}
                    {totalDisplayPages > 1 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <button
                                onClick={() => onPageChange(displayPage - 1)}
                                disabled={displayPage === 1}
                                className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>
                            <span>
                                {displayPage} / {totalDisplayPages}
                            </span>
                            <button
                                onClick={() => onPageChange(displayPage + 1)}
                                disabled={displayPage === totalDisplayPages}
                                className="hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    ) : (
                        // Spacer so the clear-all button stays right-aligned when there is no pagination
                        <span />
                    )}

                    {/* Clear all — only shown when there is something to clear */}
                    {totalRequestCount > 0 && (
                        <ConfirmDialog
                            trigger={
                                <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                                    Clear all
                                </button>
                            }
                            title="Clear all requests"
                            description={`Delete all ${totalRequestCount} request${totalRequestCount === 1 ? '' : 's'}? This cannot be undone.`}
                            confirmLabel="Clear all"
                            onConfirm={onClearAll}
                        />
                    )}
                </div>
            </div>

            {isLoadingRequests ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading requests…</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center px-4">
                    <p className="text-sm text-muted-foreground">
                        No requests yet.
                        <br />
                        Send a webhook to your endpoint URL.
                    </p>
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <ul className="flex flex-col">
                        {requests.map((req) => (
                            <RequestRow
                                key={req.id}
                                request={req}
                                isSelected={req.id === selectedId}
                                onClick={() => onSelect(req.id)}
                            />
                        ))}
                    </ul>
                </ScrollArea>
            )}
        </div>
    );
}

/**
 * Single row in the request list.
 *
 * @param {{ request: object, isSelected: boolean, onClick: function }} props
 */
function RequestRow({ request, isSelected, onClick }) {
    const contentType =
        request.headers?.['content-type'] ?? request.headers?.['Content-Type'] ?? '—';
    const bodySize = request.body ? `${request.body.length}B` : '0B';

    return (
        <li>
            <button
                onClick={onClick}
                className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-border transition-colors',
                    isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/50 text-foreground',
                )}
            >
                <div className="flex items-center gap-2 mb-1">
                    <MethodBadge method={request.method} />
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {formatRelative(request.receivedAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate flex-1">{truncateContentType(contentType)}</span>
                    <span className="shrink-0">{bodySize}</span>
                </div>
                {request.sourceIp && (
                    <div className="text-xs text-muted-foreground/60 truncate mt-0.5 font-mono">
                        {request.sourceIp}
                    </div>
                )}
            </button>
        </li>
    );
}

/**
 * Converts a full content-type value to a short, readable label.
 *
 * @param {string} contentType
 * @returns {string}
 */
function truncateContentType(contentType) {
    if (!contentType || contentType === '—') return '—';
    // Strip parameters like "; charset=utf-8"
    return contentType.split(';')[0].trim();
}

/**
 * Converts an ISO timestamp to a human-readable relative string.
 *
 * @param {string} isoString
 * @returns {string}
 */
function formatRelative(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
