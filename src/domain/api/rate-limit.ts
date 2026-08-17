export type RateLimitConfig = {
    /** Requests allowed per window. */
    limit: number
    windowMs: number
}

export type Bucket = {
    count: number
    /** Epoch ms at which the window rolls over. */
    resetAt: number
}

export type Decision = {
    allowed: boolean
    remaining: number
    retryAfterSeconds: number
    /** The bucket to store back; the caller owns the storage. */
    bucket: Bucket
}

/**
 * Fixed-window counter, written as a pure step so the expiry and boundary rules
 * are unit-testable without clocks or a server.
 */
export const consume = (
    bucket: Bucket | undefined,
    now: number,
    { limit, windowMs }: RateLimitConfig
): Decision => {
    // A window that has rolled over is indistinguishable from a first request.
    const current =
        bucket && bucket.resetAt > now
            ? bucket
            : { count: 0, resetAt: now + windowMs }

    if (current.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            // Round up: a 0 would invite an immediate, still-blocked retry.
            retryAfterSeconds: Math.max(
                1,
                Math.ceil((current.resetAt - now) / 1000)
            ),
            bucket: current,
        }
    }

    const next = { count: current.count + 1, resetAt: current.resetAt }

    return {
        allowed: true,
        remaining: limit - next.count,
        retryAfterSeconds: 0,
        bucket: next,
    }
}

/** Drops windows that have already rolled over, so the store can't grow forever. */
export const prune = (
    buckets: Map<string, Bucket>,
    now: number
): Map<string, Bucket> => {
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
    }
    return buckets
}
