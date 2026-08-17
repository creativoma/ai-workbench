import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UIMessageChunk } from 'ai'
import { Chat } from './Chat'
import { countingTransport, fakeTransport } from './test-support'

// Mirrors the real server: the tool runs in its own step, then the model's
// final answer opens a new one. Without that trailing text step the last step
// is nothing but a resolved tool call, which is exactly the condition
// `sendAutomaticallyWhen` watches for — useChat would resend forever.
const weatherToolChunks: UIMessageChunk[] = [
    { type: 'start' },
    { type: 'start-step' },
    { type: 'tool-input-start', toolCallId: 'call-1', toolName: 'getWeather' },
    {
        type: 'tool-input-available',
        toolCallId: 'call-1',
        toolName: 'getWeather',
        input: { city: 'Madrid' },
    },
    {
        type: 'tool-output-available',
        toolCallId: 'call-1',
        output: { city: 'Madrid', temperatureC: 21, conditions: 'sunny' },
    },
    { type: 'finish-step' },
    { type: 'start-step' },
    { type: 'text-start', id: 't1' },
    { type: 'text-delta', id: 't1', delta: 'Hace 21 grados en Madrid.' },
    { type: 'text-end', id: 't1' },
    { type: 'finish-step' },
    { type: 'finish' },
]

const sendAnything = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'Clima en Madrid?')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
}

describe('weather tool rendering', () => {
    it('renders the tool result as a weather card', async () => {
        // maxCalls 1: a resend loop throws instead of hanging the suite.
        const { transport, callCount } = countingTransport(
            [weatherToolChunks],
            1
        )
        render(<Chat transport={transport} />)

        await sendAnything()

        const card = await screen.findByRole('article', {
            name: /weather in madrid/i,
        })
        expect(card).toHaveTextContent('Madrid')
        expect(card).toHaveTextContent('21')
        expect(card).toHaveTextContent('sunny')
        expect(callCount()).toBe(1)
    })

    it('shows a progress placeholder while the tool input streams', async () => {
        render(
            <Chat
                transport={fakeTransport([
                    { type: 'start' },
                    { type: 'start-step' },
                    {
                        type: 'tool-input-start',
                        toolCallId: 'call-1',
                        toolName: 'getWeather',
                    },
                ])}
            />
        )

        await sendAnything()

        expect(
            await screen.findByText(/checking the weather/i)
        ).toBeInTheDocument()
    })
})
