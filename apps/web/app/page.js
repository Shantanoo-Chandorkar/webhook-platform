'use client';

import { useState } from 'react';
import { createEndpoint } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SiteNav } from '@/components/landing/SiteNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SiteFooter } from '@/components/landing/SiteFooter';

const MAX_RECENT_SLUGS = 5;

/**
 * Landing page. Owns endpoint generation state and recent-slug persistence,
 * then delegates all rendering to the landing section components.
 */
export default function LandingPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [recentSlugs, setRecentSlugs] = useLocalStorage('webhook_recent_slugs', []);

    /**
     * Creates a new endpoint via the API and prepends its slug to the recent list.
     *
     * @returns {Promise<void>}
     */
    async function handleGenerate() {
        setIsGenerating(true);
        setError(null);
        try {
            const endpoint = await createEndpoint();
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
        <div className="flex flex-col min-h-full">
            <SiteNav onGenerate={handleGenerate} isGenerating={isGenerating} />

            <main className="flex-1 flex flex-col">
                <HeroSection
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    error={error}
                    slugs={recentSlugs}
                    onClearHistory={handleClearHistory}
                />
                <FeatureGrid />
                <HowItWorksSection />
            </main>

            <SiteFooter />
        </div>
    );
}
