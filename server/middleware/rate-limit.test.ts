import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { textStreamModel } from '../test-support/mock-model'

const planRequest = (ip = '10.0.0.1') =>
    new Request('http://localhost/api/plan', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-forwarded-for': ip,
        },
        body: JSON.stringify({ goal: 'Ship the API' }),
    })

// A frozen clock keeps the window from rolling over mid-test.
const appWithLimit = (limit: number, now = () => 1_000) =>
    createApp({
        model: textStreamModel(['{"goal":"Ship the API","steps":[]}']),
        rateLimit: { limit, windowMs: 60_000, now },
    })

describe('API rate limiting', () => {
    it('serves requests up to the limit', async () => {
        const app = appWithLimit(2)

        expect((await app.request(planRequest())).status).toBe(200)
        expect((await app.request(planRequest())).status).toBe(200)
    })

    it('answers 429 past the limit with a Retry-After', async () => {
        const app = appWithLimit(1)

        await app.request(planRequest())
        const blocked = await app.request(planRequest())

        expect(blocked.status).toBe(429)
        expect(blocked.headers.get('Retry-After')).toBe('60')
        expect(await blocked.json()).toEqual({ error: 'Too many requests' })
    })

    it('counts each client separately', async () => {
        const app = appWithLimit(1)

        await app.request(planRequest('10.0.0.1'))

        expect((await app.request(planRequest('10.0.0.2'))).status).toBe(200)
    })

    it('reports the remaining budget on every response', async () => {
        const app = appWithLimit(2)

        const first = await app.request(planRequest())
        const second = await app.request(planRequest())

        expect(first.headers.get('RateLimit-Limit')).toBe('2')
        expect(first.headers.get('RateLimit-Remaining')).toBe('1')
        expect(second.headers.get('RateLimit-Remaining')).toBe('0')
    })

    it('lets the client through again once the window rolls over', async () => {
        let now = 1_000
        const app = appWithLimit(1, () => now)

        await app.request(planRequest())
        expect((await app.request(planRequest())).status).toBe(429)

        now = 62_000
        expect((await app.request(planRequest())).status).toBe(200)
    })

    it('is off unless configured, so tests are not throttled', async () => {
        const app = createApp({
            model: textStreamModel(['{"goal":"g","steps":[]}']),
        })

        for (let i = 0; i < 5; i++) {
            expect((await app.request(planRequest())).status).toBe(200)
        }
    })
})
