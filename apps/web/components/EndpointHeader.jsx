'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Top bar of the dashboard showing the webhook URL, TTL countdown, SSE status,
 * and controls for copying the URL, setting the default replay URL, and sharing.
 *
 * @param {{
 *   endpoint: object,
 *   sseStatus: 'connecting'|'connected'|'reconnecting',
 *   onDefaultReplayUrlSave: function(string): Promise<void>
 * }} props
 */
export function EndpointHeader({ endpoint, sseStatus, onDefaultReplayUrlSave }) {
    const [urlCopied, setUrlCopied] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [editingReplayUrl, setEditingReplayUrl] = useState(false);
    const [replayUrlInput, setReplayUrlInput] = useState(endpoint.defaultReplayUrl ?? '');
    const [isSaving, setIsSaving] = useState(false);

    // Update the TTL countdown every second
    useEffect(() => {
        function computeTimeLeft() {
            const diff = new Date(endpoint.expiresAt).getTime() - Date.now();
            if (diff <= 0) return 'Expired';
            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
            return `Expires in ${minutes}m`;
        }

        setTimeLeft(computeTimeLeft());
        const interval = setInterval(() => setTimeLeft(computeTimeLeft()), 1000);
        return () => clearInterval(interval);
    }, [endpoint.expiresAt]);

    async function handleCopyUrl() {
        await navigator.clipboard.writeText(endpoint.url);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
    }

    async function handleShare() {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    }

    async function handleSaveReplayUrl() {
        setIsSaving(true);
        try {
            await onDefaultReplayUrlSave(replayUrlInput);
            setEditingReplayUrl(false);
            toast.success('Default replay URL saved');
        } catch {
            toast.error('Failed to save replay URL');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-2 p-3 border-b border-border">
            {/* URL row */}
            <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-1.5 truncate text-foreground">
                    {endpoint.url}
                </code>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="h-7 text-xs shrink-0"
                >
                    {urlCopied ? 'Copied!' : 'Copy'}
                </Button>
            </div>

            {/* Status row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {/* SSE status dot */}
                <span className="flex items-center gap-1.5">
                    <span
                        className={cn('inline-block w-2 h-2 rounded-full', {
                            'bg-green-500': sseStatus === 'connected',
                            'bg-amber-400': sseStatus === 'reconnecting',
                            'bg-zinc-400': sseStatus === 'connecting',
                        })}
                    />
                    {sseStatus === 'connected' && 'Live'}
                    {sseStatus === 'reconnecting' && 'Reconnecting…'}
                    {sseStatus === 'connecting' && 'Connecting…'}
                </span>

                <span className="text-muted-foreground/60">·</span>

                {/* TTL countdown */}
                <span>{timeLeft}</span>

                {/* Actions */}
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="h-6 text-xs px-2"
                    >
                        {shareCopied ? 'Link copied!' : 'Share'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingReplayUrl((v) => !v)}
                        className="h-6 text-xs px-2"
                    >
                        Set Replay URL
                    </Button>
                </div>
            </div>

            {/* Inline replay URL editor */}
            {editingReplayUrl && (
                <div className="flex items-center gap-2 mt-1">
                    <Input
                        type="url"
                        placeholder="https://your-server.com/webhook"
                        value={replayUrlInput}
                        onChange={(e) => setReplayUrlInput(e.target.value)}
                        className="h-7 text-xs font-mono flex-1"
                    />
                    <Button
                        size="sm"
                        onClick={handleSaveReplayUrl}
                        disabled={isSaving}
                        className="h-7 text-xs shrink-0"
                    >
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingReplayUrl(false)}
                        className="h-7 text-xs shrink-0"
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}
