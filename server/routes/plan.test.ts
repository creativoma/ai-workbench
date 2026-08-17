import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { textStreamModel } from '../test-support/mock-model'

const planRequest = (body: unknown) =>
    new Request('http://localhost/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })

// streamObject asks the model for JSON, so the mock streams the object in
// fragments the way a real provider would.
const planDeltas = [
    '{"goal":"Ship the API",',
    '"steps":[{"title":"Design",',
    '"detail":"Sketch the routes."}',
    ']}',
]

describe('POST /api/plan', () => {
    it('streams the structured plan as JSON text', async () => {
        const app = createApp({ model: textStreamModel(planDeltas) })

        const res = await app.request(planRequest({ goal: 'Ship the API' }))

        expect(res.status).toBe(200)
        const body = await res.text()
        expect(JSON.parse(body)).toEqual({
            goal: 'Ship the API',
            steps: [{ title: 'Design', detail: 'Sketch the routes.' }],
        })
    })

    it('streams partial JSON before the object is complete', async () => {
        const app = createApp({ model: textStreamModel(planDeltas) })

        const res = await app.request(planRequest({ goal: 'Ship the API' }))
        const reader = res.body!.getReader()
        const first = await reader.read()
        await reader.cancel()

        expect(new TextDecoder().decode(first.value)).toContain('Ship the API')
    })

    it('rejects a request with no goal', async () => {
        const app = createApp({ model: textStreamModel(planDeltas) })

        const res = await app.request(planRequest({ goal: '' }))

        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'goal is required' })
    })
})
