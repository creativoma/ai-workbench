import type { ReactNode } from 'react'
import { Sparkle } from '../ui/Sparkle'

/**
 * Shared resting state for a tool that has been called but has not answered.
 * A pill rather than a card: there is nothing to fill a card with yet.
 */
export function ToolPending({ children }: { children: ReactNode }) {
    return (
        <p
            role="status"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-line-200 bg-surface-0 py-1.5 pr-3.5 pl-3 text-[13px] leading-5 text-ink-500"
        >
            <Sparkle size={14} muted className="shrink-0 text-ink-400" />
            {children}
        </p>
    )
}
