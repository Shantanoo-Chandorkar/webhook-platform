'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { Suspense } from 'react';
import { getEndpoint, getRequests, getRequest, deleteRequest, patchEndpoint } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { EndpointHeader } from '@/components/EndpointHeader';
import { FilterBar, applyFilters } from '@/components/FilterBar';
import { RequestList } from '@/components/RequestList';
import { RequestDetail } from '@/components/RequestDetail';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Dashboard page for a single endpoint.
 *
 * Layout: fixed-height split panel with the request list on the left and the
 * detail panel on the right. Real-time updates arrive via SSE and are prepended
 * to the in-memory request list without requiring a page refresh.
 */
function DashboardPage({ params }) {
    const { slug } = use(params);

    const [endpoint, setEndpoint] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        methods: [],
        contentType: '',
        body: '',
        timeRange: 'all',
    });

    // Persist slug in recent list so the landing page can show it
    const [, setRecentSlugs] = useLocalStorage('webhook_recent_slugs', []);

    // Load endpoint metadata and initial request history on mount
    useEffect(() => {
        async function initialLoad() {
            try {
                const endpointData = await getEndpoint(slug);
                setEndpoint(endpointData);

                // Track this slug as recently visited (max 5)
                setRecentSlugs((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, 5));
            } catch {
                setNotFound(true);
                return;
            }

            try {
                const data = await getRequests(slug, 1, 100);
                setRequests(data.requests ?? []);
                setTotalPages(data.totalPages ?? 1);
            } catch {
                // Non-fatal — the list will just be empty on load failure
            }
        }

        initialLoad();
    }, [slug]);

    // SSE — receive new requests in real time
    const sseUrl = endpoint ? `${API_URL}/api/endpoints/${slug}/stream` : null;
    const { status: sseStatus } = useSSE(sseUrl, (eventType, data) => {
        if (eventType === 'webhook') {
            // Prepend so the newest request is always at the top
            setRequests((prev) => [data, ...prev]);
        }
    });

    // Derive filtered list from full list + active filters
    const filteredRequests = useMemo(() => applyFilters(requests, filters), [requests, filters]);

    /**
     * Fetches full request detail (including replays) when a row is selected.
     *
     * @param {string} requestId
     */
    async function handleSelectRequest(requestId) {
        setSelectedRequestId(requestId);
        try {
            const detail = await getRequest(requestId);
            setSelectedRequest(detail);
        } catch {
            // Keep whatever was previously shown rather than blanking the panel
        }
    }

    /**
     * Removes a deleted request from the list and clears the detail panel if
     * the deleted request was the selected one.
     *
     * @param {string} requestId
     */
    function handleRequestDeleted(requestId) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (selectedRequestId === requestId) {
            setSelectedRequestId(null);
            setSelectedRequest(null);
        }
    }

    /**
     * Deletes a request and updates state accordingly.
     *
     * @param {string} requestId
     */
    async function handleDeleteRequest(requestId) {
        await deleteRequest(requestId);
        handleRequestDeleted(requestId);
    }

    /**
     * Persists the new default replay URL on the endpoint and updates local state.
     *
     * @param {string} url
     */
    async function handleDefaultReplayUrlSave(url) {
        const updated = await patchEndpoint(slug, { defaultReplayUrl: url });
        setEndpoint(updated);
    }

    /**
     * Loads the next page of request history and appends it to the list.
     */
    async function handleLoadMore() {
        const nextPage = currentPage + 1;
        try {
            const data = await getRequests(slug, nextPage, 100);
            setRequests((prev) => [...prev, ...(data.requests ?? [])]);
            setCurrentPage(nextPage);
        } catch {
            // Non-fatal
        }
    }

    // When the default replay URL is updated via the ReplayPanel, sync it to endpoint state
    function handleReplayUrlSaved(url) {
        setEndpoint((prev) => (prev ? { ...prev, defaultReplayUrl: url } : prev));
    }

    if (notFound) {
        return (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-center px-6">
                <h1 className="text-xl font-semibold text-foreground">Endpoint not found</h1>
                <p className="text-sm text-muted-foreground">
                    This endpoint may have expired or never existed.
                </p>
                <a href="/" className="text-sm text-primary hover:underline">
                    Generate a new endpoint →
                </a>
            </div>
        );
    }

    if (!endpoint) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Loading…
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Site-level nav — provides a route back to the landing page */}
            <nav className="flex items-center px-4 h-10 border-b border-border shrink-0">
                <a
                    href="/"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                    ← WebhookBin
                </a>
            </nav>

            {/* Split panel layout */}
            <div className="flex flex-1 min-h-0">
                {/* Left panel — request list + controls */}
                <aside className="w-[350px] shrink-0 flex flex-col border-r border-border min-h-0">
                    <EndpointHeader
                        endpoint={endpoint}
                        sseStatus={sseStatus}
                        onDefaultReplayUrlSave={handleDefaultReplayUrlSave}
                    />
                    <FilterBar filters={filters} onChange={setFilters} />
                    <RequestList
                        requests={filteredRequests}
                        selectedId={selectedRequestId}
                        onSelect={handleSelectRequest}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onLoadMore={handleLoadMore}
                    />
                </aside>

                {/* Right panel — request detail */}
                <main className="flex-1 flex flex-col min-h-0 min-w-0">
                    <RequestDetail
                        request={selectedRequest}
                        endpointSlug={slug}
                        endpointDefaultReplayUrl={endpoint.defaultReplayUrl}
                        onDeleted={handleRequestDeleted}
                        onReplayUrlSaved={handleReplayUrlSaved}
                        deleteRequest={handleDeleteRequest}
                    />
                </main>
            </div>
        </div>
    );
}

/**
 * Wrap in Suspense because FilterBar uses useSearchParams, which requires it
 * in Next.js App Router.
 */
export default function DashboardPageWrapper(props) {
    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    Loading…
                </div>
            }
        >
            <DashboardPage {...props} />
        </Suspense>
    );
}
