import type { Context } from 'hono'

/**
 * `c.req.json()` throws on a malformed body, which would surface as a 500.
 * A bad request is the client's problem, so report it as one.
 */
export const readJson = async (
    c: Context
): Promise<{ ok: true; value: unknown } | { ok: false }> => {
    try {
        return { ok: true, value: await c.req.json() }
    } catch {
        return { ok: false }
    }
}
