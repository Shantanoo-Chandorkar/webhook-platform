'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const TIME_RANGE_OPTIONS = [
	{ label: 'All time', value: 'all' },
	{ label: 'Last 1h', value: '1h' },
	{ label: 'Last 5m', value: '5m' },
];

/**
 * Client-side filter controls for the request list.
 *
 * Filter state is persisted in URL query params so that filters survive page
 * navigation and can be shared alongside the dashboard URL. All filtering is
 * applied in-memory against the full request array — no additional API calls.
 *
 * @param {{
 *   filters: { methods: string[], contentType: string, body: string, timeRange: string },
 *   onChange: function(object): void
 * }} props
 */
export function FilterBar({ filters, onChange }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Sync URL params → filter state on mount so that shared URLs restore filters
	useEffect(() => {
		const methods = searchParams.get('methods');
		const contentType = searchParams.get('contentType') ?? '';
		const body = searchParams.get('body') ?? '';
		const timeRange = searchParams.get('timeRange') ?? 'all';

		onChange({
			methods: methods ? methods.split(',').filter(Boolean) : [],
			contentType,
			body,
			timeRange,
		});
		// Only on mount — eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/**
	 * Applies a partial filter update, merges it into state, and reflects the
	 * change in the URL without triggering a page navigation.
	 *
	 * @param {Partial<typeof filters>} partial
	 */
	function updateFilters(partial) {
		const next = { ...filters, ...partial };
		onChange(next);

		const params = new URLSearchParams(searchParams);
		if (next.methods.length > 0) {
			params.set('methods', next.methods.join(','));
		} else {
			params.delete('methods');
		}
		if (next.contentType) params.set('contentType', next.contentType);
		else params.delete('contentType');
		if (next.body) params.set('body', next.body);
		else params.delete('body');
		if (next.timeRange !== 'all') params.set('timeRange', next.timeRange);
		else params.delete('timeRange');

		router.replace(`?${params.toString()}`, { scroll: false });
	}

	function toggleMethod(method) {
		const current = filters.methods;
		const next = current.includes(method)
			? current.filter((m) => m !== method)
			: [...current, method];
		updateFilters({ methods: next });
	}

	return (
		<div className="flex flex-col gap-3 p-3 border-b border-border">
			{/* Method checkboxes */}
			<div className="flex flex-wrap gap-1.5">
				{HTTP_METHODS.map((method) => {
					const active = filters.methods.includes(method);
					return (
						<button
							key={method}
							onClick={() => toggleMethod(method)}
							className={cn(
								'px-2 py-0.5 rounded text-xs font-mono font-semibold border transition-colors',
								active
									? 'bg-primary text-primary-foreground border-primary'
									: 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground',
							)}
						>
							{method}
						</button>
					);
				})}
			</div>

			{/* Content-Type and body search */}
			<Input
				placeholder="Filter by content-type…"
				value={filters.contentType}
				onChange={(e) => updateFilters({ contentType: e.target.value })}
				className="h-7 text-xs"
			/>
			<Input
				placeholder="Search in body…"
				value={filters.body}
				onChange={(e) => updateFilters({ body: e.target.value })}
				className="h-7 text-xs"
			/>

			{/* Time range */}
			<select
				value={filters.timeRange}
				onChange={(e) => updateFilters({ timeRange: e.target.value })}
				className="h-7 text-xs rounded-md border border-input bg-background px-2 text-foreground"
			>
				{TIME_RANGE_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

/**
 * Applies all active filters to the full request array.
 *
 * Returns a new array containing only requests that match every active filter
 * (all filters are AND'd together).
 *
 * @param {Array} requests - Full in-memory request list
 * @param {{ methods: string[], contentType: string, body: string, timeRange: string }} filters
 * @returns {Array}
 */
export function applyFilters(requests, filters) {
	return requests.filter((req) => {
		// Method filter: if none selected, show all
		if (filters.methods.length > 0 && !filters.methods.includes(req.method)) {
			return false;
		}

		// Content-type substring match
		if (filters.contentType) {
			const ct = req.headers?.['content-type'] ?? req.headers?.['Content-Type'] ?? '';
			if (!ct.toLowerCase().includes(filters.contentType.toLowerCase())) return false;
		}

		// Body substring match
		if (filters.body) {
			const bodyText = req.body ?? '';
			if (!bodyText.toLowerCase().includes(filters.body.toLowerCase())) return false;
		}

		// Time range filter
		if (filters.timeRange !== 'all') {
			const cutoff = filters.timeRange === '5m' ? 5 * 60 * 1000 : 60 * 60 * 1000;
			if (Date.now() - new Date(req.receivedAt).getTime() > cutoff) return false;
		}

		return true;
	});
}
