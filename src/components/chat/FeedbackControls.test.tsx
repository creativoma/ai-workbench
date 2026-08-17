import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UIMessageChunk } from 'ai'
import { Chat } from './Chat'
import { fakeTransport } from './test-support'

// Mirrors what the traced server sends: the trace id arrives as metadata on the
// assistant message's `start` chunk.
const tracedReply = (traceId: string): UIMessageChunk[] => [
    { type: 'start', messageMetadata: { traceId } },
    { type: 'start-step' },
    { type: 'text-start', id: 't1' },
    { type: 'text-delta', id: 't1', delta: 'Hola' },
    { type: 'text-end', id: 't1' },
    { type: 'finish-step' },
    { type: 'finish' },
]

const untracedReply: UIMessageChunk[] = [
    { type: 'start' },
    { type: 'start-step' },
    { type: 'text-start', id: 't1' },
    { type: 'text-delta', id: 't1', delta: 'Hola' },
    { type: 'text-end', id: 't1' },
    { type: 'finish-step' },
    { type: 'finish' },
]

const sendAnything = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'Saluda')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
}

describe('answer feedback', () => {
    it('scores the traced answer with a thumbs up', async () => {
        const sendFeedback = vi.fn().mockResolvedValue(undefined)
        render(
            <Chat
                transport={fakeTransport(tracedReply('trace-abc'))}
                sendFeedback={sendFeedback}
            />
        )

        await sendAnything()
        await userEvent.click(
            await screen.findByRole('button', { name: /^helpful$/i })
        )

        expect(sendFeedback).toHaveBeenCalledWith({
            traceId: 'trace-abc',
            rating: 'up',
        })
        expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i)
    })

    it('scores a bad answer with a thumbs down', async () => {
        const sendFeedback = vi.fn().mockResolvedValue(undefined)
        render(
            <Chat
                transport={fakeTransport(tracedReply('trace-xyz'))}
                sendFeedback={sendFeedback}
            />
        )

        await sendAnything()
        await userEvent.click(
            await screen.findByRole('button', { name: /not helpful/i })
        )

        expect(sendFeedback).toHaveBeenCalledWith({
            traceId: 'trace-xyz',
            rating: 'down',
        })
    })

    it('accepts only one vote per answer', async () => {
        const sendFeedback = vi.fn().mockResolvedValue(undefined)
        render(
            <Chat
                transport={fakeTransport(tracedReply('trace-abc'))}
                sendFeedback={sendFeedback}
            />
        )

        await sendAnything()
        await userEvent.click(
            await screen.findByRole('button', { name: /^helpful$/i })
        )

        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: /not helpful/i })
            ).toBeDisabled()
        )
        expect(sendFeedback).toHaveBeenCalledTimes(1)
    })

    it('keeps the answer and allows a retry when scoring fails', async () => {
        const sendFeedback = vi.fn().mockRejectedValue(new Error('offline'))
        render(
            <Chat
                transport={fakeTransport(tracedReply('trace-abc'))}
                sendFeedback={sendFeedback}
            />
        )

        await sendAnything()
        await userEvent.click(
            await screen.findByRole('button', { name: /^helpful$/i })
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /could not send feedback/i
        )
        expect(screen.getByRole('button', { name: /^helpful$/i })).toBeEnabled()
        expect(screen.getByText('Hola')).toBeInTheDocument()
    })

    it('offers no rating when the turn was not traced', async () => {
        render(
            <Chat
                transport={fakeTransport(untracedReply)}
                sendFeedback={vi.fn()}
            />
        )

        await sendAnything()
        expect(await screen.findByText('Hola')).toBeInTheDocument()
        expect(
            screen.queryByRole('group', { name: /rate this answer/i })
        ).not.toBeInTheDocument()
    })
})
