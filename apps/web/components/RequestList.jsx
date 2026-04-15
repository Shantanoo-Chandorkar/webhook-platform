'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { MethodBadge } from '@/components/MethodBadge';
import { cn } from '@/lib/utils';

/**
 * Scrollable list of captured webhook requests.
 *
 * Each row shows the HTTP method, relative timestamp, source IP, content-type,
 * and body size. Clicking a row selects it for full inspection.
 *
 * @param {{
 *   requests: Array,
 *   selectedId: string|null,
 *   onSelect: function(string): void,
 *   totalPages: number,
 *   currentPage: number,
 *   onLoadMore: function(): void
 * }} props
 */
export function RequestList({ requests, selectedId, onSelect, totalPages, currentPage, onLoadMore }) {
	if (requests.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center text-center px-4">
				<p className="text-sm text-muted-foreground">
					No requests yet.
					<br />
					Send a webhook to your endpoint URL.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-h-0">
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

				{totalPages > currentPage && (
					<div className="p-3 flex justify-center">
						<button
							onClick={onLoadMore}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Load more
						</button>
					</div>
				)}
			</ScrollArea>
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
