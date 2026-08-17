import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UIMessageChunk } from 'ai'
import { Chat } from './Chat'
import {
    countingTransport,
    fakeTransport,
    toolOutputThenTextChunks,
} from './test-support'

const approvalRequestChunks: UIMessageChunk[] = [
    { type: 'start' },
    { type: 'start-step' },
    {
        type: 'tool-input-available',
        toolCallId: 'call-9',
        toolName: 'sendEmail',
        input: {
            to: 'ana@example.com',
            subject: 'Hola',
            body: 'Contenido',
        },
    },
    {
        type: 'tool-approval-request',
        approvalId: 'appr-1',
        toolCallId: 'call-9',
    },
    { type: 'finish-step' },
    { type: 'finish' },
]

const sendAnything = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'Envia el email')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
}

describe('email approval flow', () => {
    it('shows the pending email with Approve and Reject actions', async () => {
        render(<Chat transport={fakeTransport(approvalRequestChunks)} />)

        await sendAnything()

        const card = await screen.findByRole('article', {
            name: /approval required/i,
        })
        expect(card).toHaveTextContent('ana@example.com')
        expect(
            screen.getByRole('button', { name: /approve/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: /reject/i })
        ).toBeInTheDocument()
    })

    it('resumes the run when the user approves', async () => {
        const { transport, callCount } = countingTransport([
            approvalRequestChunks,
            toolOutputThenTextChunks(
                'call-9',
                { delivered: true, to: 'ana@example.com' },
                ['Enviado']
            ),
        ])
        render(<Chat transport={transport} />)

        await sendAnything()
        await userEvent.click(
            await screen.findByRole('button', { name: /approve/i })
        )

        await waitFor(() => expect(callCount()).toBe(2))
        expect(await screen.findByText('Enviado')).toBeInTheDocument()
    })
})
