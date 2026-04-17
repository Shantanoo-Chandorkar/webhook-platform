'use client';

import { Button } from '@/components/ui/button';

/**
 * Sticky top navigation bar shown on the landing page.
 *
 * Provides a persistent entry point to generate an endpoint without
 * requiring the user to scroll back to the hero CTA.
 *
 * @param {{
 *   onGenerate: function(): void,
 *   isGenerating: boolean,
 * }} props
 */
export function SiteNav({ onGenerate, isGenerating }) {
	return (
		<header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
			<div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
				<span className="text-sm font-semibold text-foreground tracking-tight">WebhookBin</span>
				<Button size="sm" onClick={onGenerate} disabled={isGenerating}>
					{isGenerating ? 'Generating...' : 'Generate Endpoint'}
				</Button>
			</div>
		</header>
	);
}
