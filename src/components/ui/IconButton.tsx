import type { ReactNode } from 'react'

type IconButtonProps = {
    /** Required: every icon-only control needs an accessible name (§9). */
    label: string
    children: ReactNode
    active?: boolean
    onClick?: () => void
    className?: string
}

/**
 * Icon-only control with the tooltip DESIGN.md §3 asks for: 400ms delay,
 * ink-950 on white 12px. CSS-driven rather than timer-driven, and aria-hidden
 * so the accessible name comes from `label` alone instead of being announced
 * twice.
 */
export function IconButton({
    label,
    children,
    active = false,
    onClick,
    className = '',
}: IconButtonProps) {
    return (
        <span className="group relative inline-flex">
            <button
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={onClick}
                className={[
                    'touch-target relative grid size-9 place-items-center rounded-md',
                    'transition-colors duration-[120ms] ease-out',
                    active
                        ? 'bg-tint-lilac text-brand-500'
                        : 'text-ink-400 hover:bg-surface-2 hover:text-ink-700',
                    className,
                ].join(' ')}
            >
                {children}
            </button>
            <span
                aria-hidden="true"
                className={[
                    'pointer-events-none absolute top-1/2 left-[calc(100%+6px)] z-50 -translate-y-1/2',
                    'rounded-sm bg-ink-950 px-2 py-1 text-[12px] leading-4 whitespace-nowrap text-white',
                    'opacity-0 transition-opacity duration-[120ms] ease-out',
                    'group-hover:opacity-100 group-hover:delay-[400ms]',
                ].join(' ')}
            >
                {label}
            </span>
        </span>
    )
}
