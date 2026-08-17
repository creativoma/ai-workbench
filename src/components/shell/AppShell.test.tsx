import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

const renderShell = () =>
    render(
        <AppShell title="Streaming chat states">
            <p>canvas content</p>
        </AppShell>
    )

describe('app shell', () => {
    it('names both navigation regions so they are distinguishable', () => {
        renderShell()

        expect(
            screen.getByRole('navigation', { name: 'Sections' })
        ).toBeInTheDocument()
        // Two sidebars exist in the tree (inline + drawer is conditional), so
        // scope by role name rather than assuming a single match.
        expect(
            screen.getAllByRole('navigation', { name: 'Chats' }).length
        ).toBeGreaterThan(0)
    })

    it('shows the conversation title in the top bar', () => {
        renderShell()

        // The title deliberately appears twice — breadcrumb and the current
        // history row — so this scopes to the bar.
        const bar = screen.getByRole('banner')

        expect(bar).toHaveTextContent('Streaming chat states')
        expect(
            screen.getByRole('button', { name: /share/i })
        ).toBeInTheDocument()
    })

    it('renders its children as the canvas', () => {
        renderShell()

        expect(screen.getByText('canvas content')).toBeInTheDocument()
    })

    it('marks the current history row for assistive tech', () => {
        renderShell()

        const current = screen
            .getAllByRole('link')
            .filter((link) => link.getAttribute('aria-current') === 'page')

        expect(current).toHaveLength(1)
        expect(current[0]).toHaveTextContent('Streaming chat states')
    })

    it('gives every rail button an accessible name', () => {
        renderShell()

        const rail = screen.getByRole('navigation', { name: 'Sections' })

        for (const button of screen
            .getAllByRole('button')
            .filter((b) => rail.contains(b))) {
            expect(button).toHaveAccessibleName()
        }
    })

    it('opens the sidebar drawer and closes it again', async () => {
        renderShell()

        const sidebarCount = screen.getAllByRole('navigation', {
            name: 'Chats',
        }).length

        await userEvent.click(
            screen.getByRole('button', { name: /open sidebar/i })
        )

        // The drawer adds a second copy of the sidebar.
        expect(
            screen.getAllByRole('navigation', { name: 'Chats' })
        ).toHaveLength(sidebarCount + 1)

        // jsdom applies no media queries, so the inline sidebar is in the tree
        // too; the drawer's copy is the later one.
        const collapse = screen.getAllByRole('button', {
            name: /collapse sidebar/i,
        })
        await userEvent.click(collapse[collapse.length - 1]!)

        await waitFor(() =>
            expect(
                screen.getAllByRole('navigation', { name: 'Chats' })
            ).toHaveLength(sidebarCount)
        )
    })

    it('closes the drawer on Escape', async () => {
        renderShell()
        const before = screen.getAllByRole('navigation', {
            name: 'Chats',
        }).length

        await userEvent.click(
            screen.getByRole('button', { name: /open sidebar/i })
        )
        await userEvent.keyboard('{Escape}')

        await waitFor(() =>
            expect(
                screen.getAllByRole('navigation', { name: 'Chats' })
            ).toHaveLength(before)
        )
    })
})
