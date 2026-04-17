'use client';

import { Button } from '@/components/ui/button';

/**
 * Landing page hero with headline, subtitle, primary CTA, and inline error display.
 *
 * @param {{
 *   onGenerate: function(): void,
 *   isGenerating: boolean,
 *   error: string|null,
 * }} props
 */
export function HeroSection({ onGenerate, isGenerating, error }) {
	return (
		<section className="py-24 px-6 flex flex-col items-center text-center gap-6">
			<div className="max-w-2xl flex flex-col items-center gap-5">
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Webhook Inspection Tool
				</p>

				<h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
					Inspect, debug and replay
					<br />
					webhooks in real time
				</h1>

				<p className="text-lg text-muted-foreground max-w-xl">
					Generate a unique endpoint URL, capture every incoming HTTP request, and replay it to any
					target. No account required. Live in seconds.
				</p>

				<div className="flex flex-col items-center gap-2 mt-2">
					<Button size="lg" onClick={onGenerate} disabled={isGenerating} className="px-8">
						{isGenerating ? 'Generating...' : 'Get Started Free'}
					</Button>
					<p className="text-xs text-muted-foreground">
						No signup required. Endpoints expire after 24 hours.
					</p>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>
			</div>
		</section>
	);
}
