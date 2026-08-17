import type { MiddlewareHandler } from 'hono'
import {
    consume,
    prune,
    type Bucket,
    type RateLimitConfig,
} from '../../src/domain/api/rate-limit'

export type RateLimitOptions = RateLimitConfig & {
    /** Overridable so tests don't have to wait out a real window. */
    now?: () => number
    clientKey?: (headers: Headers, fallback: string) => string
}

const defaultClientKey = (headers: Headers, fallback: string) =>
    // Behind a proxy the socket address is the proxy's, so prefer the
    // forwarded chain's first hop.
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    fallback

export const rateLimit = ({
    limit,
    windowMs,
    now = Date.now,
    clientKey = defaultClientKey,
}: RateLimitOptions): MiddlewareHandler => {
    // Per-process, which is right for a single Bun server; a multi-instance
    // deploy needs a shared store (Redis) behind the same pure `consume`.
    const buckets = new Map<string, Bucket>()

    return async (c, next) => {
        const at = now()
        prune(buckets, at)

        const key = clientKey(c.req.raw.headers, 'unknown')
        const decision = consume(buckets.get(key), at, { limit, windowMs })
        buckets.set(key, decision.bucket)

        const reset = String(Math.ceil((decision.bucket.resetAt - at) / 1000))

        if (!decision.allowed) {
            c.header('RateLimit-Limit', String(limit))
            c.header('RateLimit-Remaining', '0')
            c.header('RateLimit-Reset', reset)
            c.header('Retry-After', String(decision.retryAfterSeconds))
            return c.json({ error: 'Too many requests' }, 429)
        }

        await next()

        // The routes return their own Response (a stream, usually), and Hono
        // does not merge `c.header()` into that — so set them on the way out.
        c.res.headers.set('RateLimit-Limit', String(limit))
        c.res.headers.set('RateLimit-Remaining', String(decision.remaining))
        c.res.headers.set('RateLimit-Reset', reset)
    }
}
