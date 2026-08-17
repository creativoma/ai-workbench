import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeBlock } from './CodeBlock'

const stubClipboard = (writeText = vi.fn().mockResolvedValue(undefined)) => {
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
    })
    return writeText
}

describe('code card', () => {
    it('titles itself with the filename when the fence names one', () => {
        render(<CodeBlock code="const a = 1" language="ts" filename="app.ts" />)

        expect(screen.getByText('app.ts')).toBeInTheDocument()
    })

    it('falls back to the language, then to a generic title', () => {
        const { unmount } = render(<CodeBlock code="x" language="css" />)
        expect(screen.getByText('css')).toBeInTheDocument()
        unmount()

        render(<CodeBlock code="x" />)
        expect(screen.getByText('Code')).toBeInTheDocument()
    })

    it('renders the code verbatim, blank lines and all', () => {
        render(<CodeBlock code={'a\n\nb'} />)

        // textContent keeps the newlines the <pre> preserves.
        expect(screen.getByText(/a\s+b/)).toBeInTheDocument()
    })

    it('exposes the view switch as a tablist with Source selected', () => {
        render(<CodeBlock code="x" />)

        expect(
            screen.getByRole('tablist', { name: /code view/i })
        ).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /source/i })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByRole('tab', { name: /wrap/i })).toHaveAttribute(
            'aria-selected',
            'false'
        )
    })

    it('moves the selection when wrapping is chosen', async () => {
        render(<CodeBlock code="x" />)

        await userEvent.click(screen.getByRole('tab', { name: /wrap/i }))

        expect(screen.getByRole('tab', { name: /wrap/i })).toHaveAttribute(
            'aria-selected',
            'true'
        )
        expect(screen.getByRole('tab', { name: /source/i })).toHaveAttribute(
            'aria-selected',
            'false'
        )
    })

    it('copies the code and confirms it', async () => {
        const writeText = stubClipboard()
        render(<CodeBlock code="const a = 1" />)

        await userEvent.click(screen.getByRole('button', { name: /copy/i }))

        expect(writeText).toHaveBeenCalledWith('const a = 1')
        expect(await screen.findByText('Copied')).toBeInTheDocument()
    })

    it('stays usable when the clipboard is blocked', async () => {
        stubClipboard(vi.fn().mockRejectedValue(new Error('denied')))
        render(<CodeBlock code="x" />)

        await userEvent.click(screen.getByRole('button', { name: /copy/i }))

        // No confirmation, no crash — the button is still there to retry.
        await waitFor(() =>
            expect(screen.queryByText('Copied')).not.toBeInTheDocument()
        )
        expect(
            screen.getByRole('button', { name: /copy/i })
        ).toBeInTheDocument()
    })
})
