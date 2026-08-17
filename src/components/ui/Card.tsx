import type { ReactNode } from 'react'

type CardProps = {
    /** Accessible name for the card (§9: cards are labelled regions). */
    label: string
    title: ReactNode
    actions?: ReactNode
    children: ReactNode
    /** The approval card is the one place brand-500 appears in the canvas. */
    accent?: boolean
    className?: string
}

/**
 * The shared card shell from DESIGN.md §6 — surface-0 / line-200 / radius-lg
 * with a 52px header. Tool output, structured output and code all wear it, so
 * they read as one family.
 */
export function Card({
    label,
    title,
    actions,
    children,
    accent = false,
    className = '',
}: CardProps) {
    return (
        <article
            aria-label={label}
            className={[
                'overflow-hidden rounded-lg border bg-surface-0',
                accent ? 'border-brand-200' : 'border-line-200',
                className,
            ].join(' ')}
        >
            <header
                className={[
                    'flex h-[52px] items-center justify-between gap-3 px-4',
                    accent ? 'bg-brand-50' : '',
                ].join(' ')}
            >
                <h3 className="min-w-0 truncate text-[14px] leading-5 font-medium text-ink-900">
                    {title}
                </h3>
                {actions ? (
                    <div className="flex shrink-0 items-center gap-2.5">
                        {actions}
                    </div>
                ) : null}
            </header>
            <div className="border-t border-line-100 px-5 py-4">{children}</div>
        </article>
    )
}
