import { Folder, PanelLeftClose, Plus, Search } from 'lucide-react'

// DESIGN.md §4. Static data: history and folders are not persisted yet.
const FOLDERS = ['UI Design', 'Project A'] as const
const HISTORY = [
    'Streaming chat states',
    'Weather tool card',
    'Email approval policy',
    'Plan generator schema',
] as const

type SidebarProps = {
    /** Rendered inside the drawer below lg, where the close button is shown. */
    onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
    return (
        <nav
            aria-label="Chats"
            className="flex h-full w-full flex-col border-r border-line-200 bg-surface-0"
        >
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <h1 className="text-[16px] leading-6 font-semibold tracking-[-0.01em] text-ink-950">
                    AI Workbench
                </h1>
                <button
                    type="button"
                    aria-label="Collapse sidebar"
                    onClick={onClose}
                    className="grid size-7 place-items-center rounded-sm text-ink-400 transition-colors duration-[120ms] ease-out hover:bg-surface-2 hover:text-ink-700"
                >
                    <PanelLeftClose size={18} strokeWidth={1.5} />
                </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5">
                {/* The only filled-brand surface in the sidebar. */}
                <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-500 text-[14px] leading-5 font-semibold text-white transition-colors duration-[120ms] ease-out hover:bg-brand-600 active:bg-brand-700"
                >
                    <Plus size={16} strokeWidth={2} aria-hidden="true" />
                    New chat
                </button>

                <button
                    type="button"
                    className="mt-2 flex h-9 items-center gap-2.5 rounded-md px-2 text-left transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                >
                    <Search
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="text-ink-400"
                    />
                    <span className="text-[14px] leading-5 text-ink-500">
                        Search chat
                    </span>
                </button>

                {/* Full-bleed dividers: the body has 20px inline padding. */}
                <hr className="-mx-5 mt-4 mb-5 border-0 border-t border-line-200" />

                <SectionLabel>Folder</SectionLabel>
                <ul className="flex flex-col gap-0.5">
                    {FOLDERS.map((name) => (
                        <li key={name}>
                            <Row icon={<Folder size={16} strokeWidth={1.5} />}>
                                {name}
                            </Row>
                        </li>
                    ))}
                </ul>

                <hr className="-mx-5 mt-4 mb-5 border-0 border-t border-line-200" />

                <SectionLabel>History</SectionLabel>
                <ul className="flex flex-col gap-0.5">
                    {HISTORY.map((title, index) => (
                        <li key={title}>
                            <Row current={index === 0}>{title}</Row>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    )
}

function SectionLabel({ children }: { children: string }) {
    // §9: kept visually light with size and tracking, not a lighter grey.
    return (
        <h2 className="mb-2 px-2 text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink-400 uppercase">
            {children}
        </h2>
    )
}

function Row({
    children,
    icon,
    current = false,
}: {
    children: string
    icon?: React.ReactNode
    current?: boolean
}) {
    return (
        <a
            href="#"
            aria-current={current ? 'page' : undefined}
            className={[
                'flex h-9 items-center gap-2.5 rounded-md px-2 text-[14px] leading-5',
                'transition-colors duration-[120ms] ease-out',
                current
                    ? 'bg-surface-2 font-medium text-ink-950'
                    : 'text-ink-700 hover:bg-surface-2 hover:text-ink-900',
            ].join(' ')}
        >
            {icon ? (
                <span aria-hidden="true" className="shrink-0 text-ink-400">
                    {icon}
                </span>
            ) : null}
            <span className="truncate">{children}</span>
        </a>
    )
}
