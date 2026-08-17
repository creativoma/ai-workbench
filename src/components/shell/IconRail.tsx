import {
    CircleHelp,
    Folder,
    House,
    MessageCircle,
    Monitor,
    PieChart,
    Settings,
} from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { Sparkle } from '../ui/Sparkle'

// DESIGN.md §3. Static for now: nothing here routes yet, so the active item is
// the one the workbench actually is.
const NAV = [
    { label: 'Home', Icon: House },
    { label: 'Chats', Icon: MessageCircle },
    { label: 'Workspace', Icon: Monitor },
    { label: 'Files', Icon: Folder },
    { label: 'Usage', Icon: PieChart },
] as const

export function IconRail() {
    return (
        <nav
            aria-label="Sections"
            className="hidden w-14 shrink-0 flex-col items-center border-r border-line-200 bg-surface-1 pt-6 pb-5 md:flex"
        >
            {/* Logo: orange diamond, a square rotated 45°. */}
            <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-sm bg-brand-500"
            >
                <span className="block size-3 rotate-45 rounded-[2px] bg-white/90" />
            </span>

            <ul className="mt-8 flex flex-col items-center gap-2">
                {NAV.map(({ label, Icon }) => (
                    <li key={label}>
                        <IconButton label={label}>
                            <Icon size={20} strokeWidth={1.5} />
                        </IconButton>
                    </li>
                ))}
                <li>
                    {/* Active item: lilac tint, full-colour glyph. */}
                    <IconButton label="Workbench" active>
                        <Sparkle size={20} />
                    </IconButton>
                </li>
            </ul>

            <ul className="mt-auto flex flex-col items-center gap-2">
                <li>
                    <IconButton label="Settings">
                        <Settings size={20} strokeWidth={1.5} />
                    </IconButton>
                </li>
                <li>
                    <IconButton label="Help">
                        <CircleHelp size={20} strokeWidth={1.5} />
                    </IconButton>
                </li>
            </ul>
        </nav>
    )
}
