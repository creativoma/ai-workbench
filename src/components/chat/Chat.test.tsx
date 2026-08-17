import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { Chat } from './Chat'
import {
    assistantTextChunks,
    controllableTransport,
    failingThenSucceedingTransport,
    fakeTransport,
} from './test-support'

describe('Chat', () => {
    it('renders the user message and the streamed assistant reply', async () => {
        const transport = fakeTransport(
            assistantTextChunks(['Hola', ' humano'])
        )
        render(<Chat transport={transport} />)

        await userEvent.type(screen.getByRole('textbox'), 'Saludos')
        await userEvent.click(screen.getByRole('button', { name: /send/i }))

        expect(await screen.findByText('Hola humano')).toBeInTheDocument()
        expect(screen.getByText('Saludos')).toBeInTheDocument()
    })

    it('clears the composer after sending', async () => {
        const transport = fakeTransport(assistantTextChunks(['ok']))
        render(<Chat transport={transport} />)
        const input = screen.getByRole('textbox')

        await userEvent.type(input, 'Saludos')
        await userEvent.click(screen.getByRole('button', { name: /send/i }))

        expect(input).toHaveValue('')
    })

    it('disables sending and offers Stop while the reply is streaming', async () => {
        const { transport, emit } = controllableTransport()
        render(<Chat transport={transport} />)

        await userEvent.type(screen.getByRole('textbox'), 'Saludos')
        await userEvent.click(screen.getByRole('button', { name: /send/i }))
        await act(async () => {
            emit({ type: 'start' })
            emit({ type: 'text-start', id: 't1' })
            emit({ type: 'text-delta', id: 't1', delta: 'Ho' })
        })

        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
        expect(
            screen.getByRole('button', { name: /stop/i })
        ).toBeInTheDocument()
    })

    it('stops streaming when Stop is clicked', async () => {
        const { transport, emit } = controllableTransport()
        render(<Chat transport={transport} />)

        await userEvent.type(screen.getByRole('textbox'), 'Saludos')
        await userEvent.click(screen.getByRole('button', { name: /send/i }))
        await act(async () => {
            emit({ type: 'start' })
            emit({ type: 'text-start', id: 't1' })
            emit({ type: 'text-delta', id: 't1', delta: 'Ho' })
        })

        await userEvent.click(screen.getByRole('button', { name: /stop/i }))

        expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('shows an error with Retry, and retrying resends the message', async () => {
        const { transport, callCount } = failingThenSucceedingTransport(
            assistantTextChunks(['Recuperado'])
        )
        render(<Chat transport={transport} />)

        await userEvent.type(screen.getByRole('textbox'), 'Saludos')
        await userEvent.click(screen.getByRole('button', { name: /send/i }))

        const alert = await screen.findByRole('alert')
        expect(alert).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /retry/i }))

        expect(await screen.findByText('Recuperado')).toBeInTheDocument()
        expect(callCount()).toBe(2)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
})
