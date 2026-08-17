import { ChevronDown, PanelLeft, Share2 } from 'lucide-react'

type TopBarProps = {
    title: string
    /** Below lg the sidebar is a drawer, so the bar owns the opener. */
    onOpenSidebar: () => void
}

// DESIGN.md §5. No bottom border — the canvas below provides the separation.
export function TopBar({ title, onOpenSidebar }: TopBarProps) {
    return (
        <header className="flex h-[68px] shrink-0 items-center justify-between px-6">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Open sidebar"
                    onClick={onOpenSidebar}
                    className="grid size-8 place-items-center rounded-sm text-ink-400 transition-colors duration-[120ms] ease-out hover:bg-surface-2 hover:text-ink-700 lg:hidden"
                >
                    <PanelLeft size={18} strokeWidth={1.5} />
                </button>

                <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded-sm px-2 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                >
                    <span className="text-[15px] leading-5 font-medium text-ink-900">
                        {title}
                    </span>
                    <ChevronDown
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="text-ink-400"
                    />
                </button>
            </div>

            <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-lg border border-line-300 bg-surface-0 px-4 shadow-xs transition-colors duration-[120ms] ease-out hover:bg-surface-2 active:shadow-none"
            >
                <Share2
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-ink-900"
                />
                {/* §8: below 768 the label drops and the button is icon-only. */}
                <span className="sr-only sm:not-sr-only text-[14px] leading-5 font-medium text-ink-900">
                    Share
                </span>
            </button>
        </header>
    )
}
