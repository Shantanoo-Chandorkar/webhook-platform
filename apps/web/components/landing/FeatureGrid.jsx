'use client';

const FEATURES = [
    {
        title: 'Real-time Capture',
        description:
            'Every HTTP request to your endpoint is captured instantly and pushed to your dashboard over a persistent SSE connection. No polling, no refresh.',
    },
    {
        title: 'Full Request Inspection',
        description:
            'View headers, query parameters, and body for every request. JSON bodies are automatically formatted and syntax-highlighted.',
    },
    {
        title: 'Request Replay',
        description:
            'Re-send any captured request to a target URL with the original method, headers, and body intact. Useful for testing downstream services.',
    },
    {
        title: 'Export as JSON',
        description:
            'Download any captured request as a structured JSON file directly from your browser. No server-side processing required.',
    },
    {
        title: 'Rate Limit Protection',
        description:
            'Automatic per-IP rate limiting blocks abusive senders and posts a real-time alert to your dashboard the moment a block is applied.',
    },
    {
        title: 'Zero Setup Required',
        description:
            'No account, no configuration, no CLI. Generate an endpoint, share the URL, and start receiving requests immediately.',
    },
];

/**
 * Grid of six feature cards communicating the product capabilities.
 * Content is driven by the FEATURES constant so copy changes do not require
 * touching the component structure.
 */
export function FeatureGrid() {
    return (
        <section className="py-20 px-6 border-t border-border">
            <div className="max-w-5xl mx-auto flex flex-col gap-12">
                <div className="text-center flex flex-col gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Everything you need to inspect webhooks
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Built for developers who need to understand exactly what a webhook sender is
                        delivering.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FEATURES.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            title={feature.title}
                            description={feature.description}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * Individual feature card within the grid.
 *
 * @param {{ title: string, description: string }} props
 */
function FeatureCard({ title, description }) {
    return (
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}
