'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Reusable confirmation dialog built on the Shadcn AlertDialog primitive.
 *
 * Manages its own open state so callers only need to provide a trigger element
 * and a confirm callback — no external open/close wiring required.
 *
 * @param {{
 *   trigger: React.ReactNode,
 *   title: string,
 *   description: string,
 *   confirmLabel?: string,
 *   onConfirm: function(): void,
 * }} props
 */
export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel = 'Confirm',
    onConfirm,
}) {
    const [open, setOpen] = useState(false);

    function handleConfirm() {
        setOpen(false);
        onConfirm();
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={trigger} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleConfirm}>
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
