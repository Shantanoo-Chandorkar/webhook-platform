'use client';

/**
 * Minimal site footer communicating the two key product expectations:
 * endpoint TTL and the absence of an account requirement.
 */
export function SiteFooter() {
    return (
        <footer className="border-t border-border py-6 px-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">WebhookBin</span>
                <span>Endpoints expire after 24 hours. No account required.</span>
            </div>
        </footer>
    );
}
