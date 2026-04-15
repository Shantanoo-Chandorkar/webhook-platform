'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createEndpoint } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const MAX_RECENT_SLUGS = 5;

/**
 * Landing page — explains the product and provides the entry point for
 * generating a new webhook endpoint. Recent endpoints are persisted in
 * localStorage for quick access without requiring an account.
 */
export default function LandingPage() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [recentSlugs, setRecentSlugs] = useLocalStorage('webhook_recent_slugs', []);

	/**
	 * Creates a new endpoint and stores the slug in the recent list.
	 * The user navigates to the dashboard themselves via the "Open →" link.
	 */
	async function handleGenerate() {
		setIsGenerating(true);
		setError(null);
		try {
			const endpoint = await createEndpoint();
			// Prepend the new slug and cap the list at MAX_RECENT_SLUGS
			setRecentSlugs((prev) =>
				[endpoint.slug, ...prev.filter((s) => s !== endpoint.slug)].slice(
					0,
					MAX_RECENT_SLUGS,
				),
			);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsGenerating(false);
		}
	}

	function handleClearHistory() {
		setRecentSlugs([]);
	}

	return (
		<main className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-16">
			{/* Hero */}
			<section className="flex flex-col items-center gap-6 text-center max-w-2xl">
				<h1 className="text-4xl font-bold tracking-tight text-foreground">
					Inspect, debug, and replay webhooks — instantly
				</h1>
				<p className="text-lg text-muted-foreground">
					Generate a unique endpoint URL in one click. Every HTTP request it receives is
					captured in real time, fully inspectable, and replayable to any target.
				</p>

				<ul className="text-sm text-muted-foreground text-left list-none space-y-2 mt-2">
					<li>⚡ Real-time request stream via Server-Sent Events</li>
					<li>🔍 Inspect headers, query params, and body — with JSON beautification</li>
					<li>🔁 Replay any captured request to a target URL</li>
					<li>📥 Export request data as JSON</li>
				</ul>

				<div className="flex flex-col items-center gap-3 mt-4 w-full max-w-xs">
					<Button
						onClick={handleGenerate}
						disabled={isGenerating}
						size="lg"
						className="w-full"
					>
						{isGenerating ? 'Generating…' : 'Generate Endpoint'}
					</Button>
					{error && (
						<p className="text-sm text-destructive text-center">{error}</p>
					)}
				</div>
			</section>

			{/* Recent endpoints */}
			{recentSlugs.length > 0 && (
				<section className="w-full max-w-md flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
							Recent endpoints
						</h2>
						<button
							onClick={handleClearHistory}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Clear history
						</button>
					</div>
					<ul className="flex flex-col gap-2">
						{recentSlugs.map((slug) => (
							<li
								key={slug}
								className="flex items-center justify-between px-4 py-2 rounded-md border border-border bg-card text-card-foreground"
							>
								<span className="font-mono text-sm text-muted-foreground truncate">
									{slug}
								</span>
								<a
									href={`/dashboard/${slug}`}
									className="text-sm text-primary hover:underline ml-4 shrink-0"
								>
									Open →
								</a>
							</li>
						))}
					</ul>
				</section>
			)}
		</main>
	);
}
