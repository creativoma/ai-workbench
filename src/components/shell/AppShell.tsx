import { useEffect, useState, type ReactNode } from 'react'
import { IconRail } from './IconRail'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type AppShellProps = {
    title: string
    children: ReactNode
}

/**
 * DESIGN.md §1 and §8: three fixed regions plus one fluid. Below lg the sidebar
 * becomes an overlay drawer (the rail stays until md); below md the rail goes
 * and the top bar owns the drawer opener.
 */
export function AppShell({ title, children }: AppShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Escape is the keyboard route out of the drawer; the scrim is a pointer
    // affordance only, so it stays out of the accessibility tree.
    useEffect(() => {
        if (!drawerOpen) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setDrawerOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [drawerOpen])

    return (
        <div className="flex h-full overflow-hidden bg-surface-0">
            <IconRail />

            {/* Inline sidebar: 264 at lg, 296 from xl. */}
            <div className="hidden w-[264px] shrink-0 lg:block xl:w-[296px]">
                <Sidebar />
            </div>

            {/* Drawer below lg. */}
            {drawerOpen ? (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        aria-hidden="true"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/[0.32]"
                    />
                    <div className="absolute inset-y-0 left-0 w-[296px] max-w-[85vw] shadow-lg">
                        <Sidebar onClose={() => setDrawerOpen(false)} />
                    </div>
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar
                    title={title}
                    onOpenSidebar={() => setDrawerOpen(true)}
                />
                {children}
            </div>
        </div>
    )
}
