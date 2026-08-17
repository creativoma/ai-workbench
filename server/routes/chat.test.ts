import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import {
    finishChunk,
    stepwiseModel,
    textChunks,
    textStreamModel,
    toolCallChunk,
    toolCallsFinishChunk,
} from '../test-support/mock-model'
import { recordingObservability } from '../test-support/recording-observability'

export const chatRequest = (body: unknown) =>
    new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })

export const userMessage = (text: string) => ({
    id: 'msg-1',
    role: 'user',
    parts: [{ type: 'text', text }],
})

describe('POST /api/chat', () => {
    it('streams the assistant reply as a UI message stream', async () => {
        const app = createApp({ model: textStreamModel(['Hola', ' mundo']) })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Saluda')] })
        )

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('text/event-stream')
        const body = await res.text()
        expect(body).toContain('Hola')
        expect(body).toContain(' mundo')
        expect(body).toContain('finish')
    })

    it('executes tool calls and continues the run to a final answer', async () => {
        const model = stepwiseModel([
            [
                toolCallChunk('getWeather', { city: 'Madrid' }),
                toolCallsFinishChunk,
            ],
            [...textChunks(['Hace 21 grados en Madrid']), finishChunk],
        ])
        const app = createApp({ model })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Clima en Madrid?')] })
        )

        expect(res.status).toBe(200)
        const body = await res.text()
        expect(body).toContain('"temperatureC":21')
        expect(body).toContain('Hace 21 grados en Madrid')
    })

    it('requests human approval before emailing outside the trusted domain', async () => {
        const model = stepwiseModel([
            [
                toolCallChunk('sendEmail', {
                    to: 'ana@example.com',
                    subject: 'Hola',
                    body: 'Contenido',
                }),
                toolCallsFinishChunk,
            ],
        ])
        const app = createApp({ model })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Envia el email')] })
        )

        const body = await res.text()
        expect(body).toContain('tool-approval-request')
        expect(body).not.toContain('"delivered":true')
    })

    it('sends email without approval inside the trusted domain', async () => {
        const model = stepwiseModel([
            [
                toolCallChunk('sendEmail', {
                    to: 'ana@asafedigital.com',
                    subject: 'Hola',
                    body: 'Contenido',
                }),
                toolCallsFinishChunk,
            ],
            [...textChunks(['Enviado']), finishChunk],
        ])
        const app = createApp({ model })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Envia el email')] })
        )

        const body = await res.text()
        expect(body).toContain('"delivered":true')
        expect(body).not.toContain('tool-approval-request')
    })
})

describe('chat tracing', () => {
    it('sends the trace id to the client as message metadata', async () => {
        const recorder = recordingObservability('trace-abc')
        const app = createApp({
            model: textStreamModel(['Hola']),
            observability: recorder.observability,
        })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Saluda')] })
        )

        const body = await res.text()
        expect(body).toContain('trace-abc')
    })

    it('tags the trace with the session so turns group together', async () => {
        const recorder = recordingObservability()
        const app = createApp({
            model: textStreamModel(['Hola']),
            observability: recorder.observability,
        })

        await app.request(
            chatRequest({
                messages: [userMessage('Saluda')],
                sessionId: 'session-7',
            })
        )

        expect(recorder.traces).toEqual([
            { traceName: 'chat', sessionId: 'session-7' },
        ])
    })

    it('streams normally when tracing is not configured', async () => {
        const app = createApp({ model: textStreamModel(['Hola']) })

        const res = await app.request(
            chatRequest({ messages: [userMessage('Saluda')] })
        )

        expect(res.status).toBe(200)
        expect(await res.text()).toContain('Hola')
    })
})
