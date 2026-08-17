/**
 * Why a model call failed, in words that are safe to put on the wire.
 *
 * The AI SDK masks stream errors as "An error occurred." by default, which is
 * true and useless: a reader cannot tell a spent quota from a bad key, and an
 * eval transcript cannot tell "the model answered badly" from "we never
 * reached the model". Forwarding the provider's raw message would fix that at
 * the cost of leaking quota figures, URLs and model ids to the browser, so this
 * maps the status code to a fixed phrase instead.
 */

type WithStatus = { statusCode?: unknown; errors?: unknown }

/**
 * A retry wrapper hides the status one level down, in the last of the attempts
 * it gave up on; anything deeper is not worth chasing.
 */
const statusOf = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null) return undefined

    const { statusCode, errors } = error as WithStatus
    if (typeof statusCode === 'number') return statusCode

    if (Array.isArray(errors) && errors.length > 0) {
        return statusOf(errors[errors.length - 1])
    }

    return undefined
}

export const describeStreamError = (error: unknown): string => {
    const status = statusOf(error)

    if (status === 429) return 'rate limited by the model provider'
    if (status === 401 || status === 403)
        return 'the model provider rejected the API key'
    if (status === 404) return 'the configured model is not available'
    if (status !== undefined && status >= 500)
        return 'the model provider is unavailable'

    return 'the model call failed'
}
