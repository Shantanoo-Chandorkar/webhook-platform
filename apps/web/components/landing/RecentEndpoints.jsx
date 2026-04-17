'use client';

/**
 * List of recently visited endpoints sourced from localStorage.
 *
 * Gives returning users one-click access to active endpoints without
 * requiring an account or persistent storage on the server.
 *
 * @param {{
 *   slugs: string[],
 *   onClear: function(): void,
 * }} props
 */
export function RecentEndpoints({ slugs, onClear }) {
    return (
        <section className="pt-12 pb-8 px-6 border-t border-border">
            <div className="mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Recent Endpoints
                    </h2>
                    <button
                        onClick={onClear}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Clear history
                    </button>
                </div>

                <ul className="flex flex-col gap-2">
                    {slugs.map((slug) => (
                        <li
                            key={slug}
                            className="flex items-center justify-between px-4 py-2.5 rounded-md border border-border bg-card"
                        >
                            <span className="font-mono text-sm text-muted-foreground truncate">
                                {slug}
                            </span>
                            <a
                                href={`/dashboard/${slug}`}
                                className="text-sm text-primary hover:underline ml-4 shrink-0"
                            >
                                Open
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
