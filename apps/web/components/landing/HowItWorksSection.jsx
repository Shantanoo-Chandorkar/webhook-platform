'use client';

const STEPS = [
	{
		step: '01',
		title: 'Generate an endpoint',
		description:
			'Click the button. A unique URL is created instantly and stays live for 24 hours. Nothing to install or configure.',
	},
	{
		step: '02',
		title: 'Point your service at it',
		description:
			'Paste the URL wherever your service sends webhooks. Any HTTP method is accepted. POST, GET, PUT, PATCH and more.',
	},
	{
		step: '03',
		title: 'Inspect and replay',
		description:
			'Open the dashboard. Every request appears in real time with full headers, body, and replay controls.',
	},
];

/**
 * Three-step walkthrough explaining how to get from zero to a live webhook
 * inspector. Intentionally brief so it does not slow down returning users.
 */
export function HowItWorksSection() {
	return (
		<section className="py-20 px-6 border-t border-border bg-muted/30">
			<div className="max-w-5xl mx-auto flex flex-col gap-12">
				<div className="text-center flex flex-col gap-3">
					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						Up and running in seconds
					</h2>
					<p className="text-muted-foreground max-w-xl mx-auto">
						No installation, no configuration. Three steps from zero to a live webhook inspector.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					{STEPS.map((item) => (
						<StepCard key={item.step} step={item.step} title={item.title} description={item.description} />
					))}
				</div>
			</div>
		</section>
	);
}

/**
 * Numbered step card within the how-it-works section.
 *
 * @param {{ step: string, title: string, description: string }} props
 */
function StepCard({ step, title, description }) {
	return (
		<div className="flex flex-col gap-3">
			<span className="text-3xl font-bold text-primary/30 font-mono leading-none">{step}</span>
			<h3 className="text-sm font-semibold text-foreground">{title}</h3>
			<p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
		</div>
	);
}
