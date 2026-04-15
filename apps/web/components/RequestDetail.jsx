'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JsonViewer } from '@/components/JsonViewer';
import { ReplayPanel } from '@/components/ReplayPanel';
import { useState } from 'react';

/**
 * Detail panel shown on the right side of the dashboard when a request is selected.
 *
 * Provides four tabs — Headers, Body, Query, and Replay — plus download and
 * delete actions. Export is done entirely client-side with no API call needed.
 *
 * @param {{
 *   request: object|null,
 *   endpointSlug: string,
 *   endpointDefaultReplayUrl: string|null,
 *   onDeleted: function(string): void,
 *   onReplayUrlSaved: function(string): void,
 *   deleteRequest: function(string): Promise<void>
 * }} props
 */
export function RequestDetail({
	request,
	endpointSlug,
	endpointDefaultReplayUrl,
	onDeleted,
	onReplayUrlSaved,
	deleteRequest,
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [headerSearch, setHeaderSearch] = useState('');

	if (!request) {
		return (
			<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
				Select a request to inspect it
			</div>
		);
	}

	async function handleDelete() {
		if (!confirm('Delete this request?')) return;
		setIsDeleting(true);
		try {
			await deleteRequest(request.id);
			onDeleted(request.id);
		} finally {
			setIsDeleting(false);
		}
	}

	/**
	 * Serialises the full request object to JSON and triggers a browser download.
	 * Pure client-side — no API call required.
	 */
	function handleDownload() {
		const json = JSON.stringify(request, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${endpointSlug}-${request.id}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	const contentType = request.headers?.['content-type'] ?? request.headers?.['Content-Type'] ?? '';
	const headers = Object.entries(request.headers ?? {});
	const queryParams = Object.entries(request.query ?? {});

	const filteredHeaders = headerSearch
		? headers.filter(
				([k, v]) =>
					k.toLowerCase().includes(headerSearch.toLowerCase()) ||
					String(v).toLowerCase().includes(headerSearch.toLowerCase()),
		  )
		: headers;

	return (
		<div className="flex-1 flex flex-col min-h-0">
			{/* Action bar */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
				<span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
					{request.id}
				</span>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleDownload} className="text-xs h-7">
						Download JSON
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={handleDelete}
						disabled={isDeleting}
						className="text-xs h-7"
					>
						{isDeleting ? 'Deleting…' : 'Delete'}
					</Button>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="headers" className="flex-1 flex flex-col min-h-0">
				<TabsList className="mx-4 mt-3 w-fit shrink-0">
					<TabsTrigger value="headers">Headers</TabsTrigger>
					<TabsTrigger value="body">Body</TabsTrigger>
					<TabsTrigger value="query">Query</TabsTrigger>
					<TabsTrigger value="replay">Replay</TabsTrigger>
				</TabsList>

				<TabsContent value="headers" className="flex-1 overflow-auto px-4 pb-4">
					<div className="flex flex-col gap-3 mt-2">
						<Input
							placeholder="Search headers…"
							value={headerSearch}
							onChange={(e) => setHeaderSearch(e.target.value)}
							className="h-8 text-sm"
						/>
						{filteredHeaders.length === 0 ? (
							<p className="text-sm text-muted-foreground">No headers found.</p>
						) : (
							<div className="overflow-auto rounded-md border border-border">
								<table className="w-full text-xs">
									<thead>
										<tr className="bg-muted/50 border-b border-border">
											<th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">
												Header
											</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">
												Value
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredHeaders.map(([key, value]) => (
											<tr key={key} className="border-b border-border last:border-0">
												<td className="px-3 py-2 font-mono text-muted-foreground">{key}</td>
												<td className="px-3 py-2 font-mono text-foreground break-all">
													{String(value)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="body" className="flex-1 overflow-auto px-4 pb-4">
					<div className="mt-2">
						<JsonViewer body={request.body} contentType={contentType} />
					</div>
				</TabsContent>

				<TabsContent value="query" className="flex-1 overflow-auto px-4 pb-4">
					<div className="mt-2">
						{queryParams.length === 0 ? (
							<div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
								No query parameters
							</div>
						) : (
							<div className="overflow-auto rounded-md border border-border">
								<table className="w-full text-xs">
									<thead>
										<tr className="bg-muted/50 border-b border-border">
											<th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">
												Parameter
											</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">
												Value
											</th>
										</tr>
									</thead>
									<tbody>
										{queryParams.map(([key, value]) => (
											<tr key={key} className="border-b border-border last:border-0">
												<td className="px-3 py-2 font-mono text-muted-foreground">{key}</td>
												<td className="px-3 py-2 font-mono text-foreground break-all">
													{String(value)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="replay" className="flex-1 overflow-auto px-4 pb-4">
					<div className="mt-2">
						<ReplayPanel
							request={request}
							endpointSlug={endpointSlug}
							endpointDefaultReplayUrl={endpointDefaultReplayUrl}
							onReplayUrlSaved={onReplayUrlSaved}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
