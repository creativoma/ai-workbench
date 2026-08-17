import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { textStreamModel } from '../test-support/mock-model'

const post = (path: string, body: string) =>
    new Request(`http://localhost${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
    })

const app = () => createApp({ model: textStreamModel(['Hola']) })

describe('API input validation', () => {
    it.each(['/api/chat', '/api/plan', '/api/feedback'])(
        'answers 400 rather than 500 for malformed JSON on %s',
        async (path) => {
            const res = await app().request(post(path, '{not json'))

            expect(res.status).toBe(400)
            expect(await res.json()).toEqual({ error: 'invalid JSON body' })
        }
    )

    it('rejects a chat request with no messages', async () => {
        const res = await app().request(
            post('/api/chat', JSON.stringify({ messages: [] }))
        )

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'messages is required' })
    })

    it('rejects messages that are not UI messages', async () => {
        const res = await app().request(
            post('/api/chat', JSON.stringify({ messages: ['nope'] }))
        )

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'invalid messages' })
    })

    it('rejects an over-long session id instead of forwarding it to Langfuse', async () => {
        const res = await app().request(
            post(
                '/api/chat',
                JSON.stringify({
                    messages: [
                        {
                            id: 'm1',
                            role: 'user',
                            parts: [{ type: 'text', text: 'hi' }],
                        },
                    ],
                    sessionId: 'x'.repeat(201),
                })
            )
        )

        expect(res.status).toBe(400)
    })

    it('still accepts a well-formed chat request', async () => {
        const res = await app().request(
            post(
                '/api/chat',
                JSON.stringify({
                    messages: [
                        {
                            id: 'm1',
                            role: 'user',
                            parts: [{ type: 'text', text: 'hi' }],
                        },
                    ],
                })
            )
        )

        expect(res.status).toBe(200)
    })
})
