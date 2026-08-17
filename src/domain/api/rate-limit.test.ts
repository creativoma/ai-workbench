import { describe, expect, it } from 'vitest'
import { consume, prune, type Bucket } from './rate-limit'

const config = { limit: 3, windowMs: 60_000 }

describe('fixed-window rate limit', () => {
    it('allows a first request and opens a window', () => {
        const decision = consume(undefined, 1_000, config)

        expect(decision.allowed).toBe(true)
        expect(decision.remaining).toBe(2)
        expect(decision.bucket).toEqual({ count: 1, resetAt: 61_000 })
    })

    it('counts down to the limit', () => {
        let bucket: Bucket | undefined
        const remaining: number[] = []

        for (let i = 0; i < 3; i++) {
            const decision = consume(bucket, 1_000, config)
            remaining.push(decision.remaining)
            bucket = decision.bucket
        }

        expect(remaining).toEqual([2, 1, 0])
    })

    it('blocks the request past the limit', () => {
        const decision = consume({ count: 3, resetAt: 61_000 }, 1_000, config)

        expect(decision.allowed).toBe(false)
        expect(decision.remaining).toBe(0)
    })

    it('does not extend the window while blocking', () => {
        const decision = consume({ count: 3, resetAt: 61_000 }, 30_000, config)

        expect(decision.bucket.resetAt).toBe(61_000)
        expect(decision.bucket.count).toBe(3)
    })

    it('reports whole seconds to wait, never zero', () => {
        expect(
            consume({ count: 3, resetAt: 61_000 }, 1_000, config)
                .retryAfterSeconds
        ).toBe(60)
        // 100ms left still has to round up, or the client retries into a block.
        expect(
            consume({ count: 3, resetAt: 61_000 }, 60_900, config)
                .retryAfterSeconds
        ).toBe(1)
    })

    it('starts a fresh window once the old one has passed', () => {
        const decision = consume({ count: 3, resetAt: 61_000 }, 61_000, config)

        expect(decision.allowed).toBe(true)
        expect(decision.bucket).toEqual({ count: 1, resetAt: 121_000 })
    })

    it('treats a limit of zero as closed', () => {
        expect(
            consume(undefined, 1_000, { limit: 0, windowMs: 60_000 }).allowed
        ).toBe(false)
    })
})

describe('pruning expired windows', () => {
    it('drops rolled-over buckets and keeps live ones', () => {
        const buckets = new Map<string, Bucket>([
            ['stale', { count: 3, resetAt: 500 }],
            ['live', { count: 1, resetAt: 5_000 }],
        ])

        prune(buckets, 1_000)

        expect([...buckets.keys()]).toEqual(['live'])
    })
})
