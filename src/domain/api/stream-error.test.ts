import { describe, expect, it } from 'vitest'
import { describeStreamError } from './stream-error'

describe('describing a stream error', () => {
    it('names a spent quota, the case that looks like a bad answer', () => {
        expect(describeStreamError({ statusCode: 429 })).toBe(
            'rate limited by the model provider'
        )
    })

    it('separates a bad key from a bad answer', () => {
        expect(describeStreamError({ statusCode: 401 })).toBe(
            'the model provider rejected the API key'
        )
        expect(describeStreamError({ statusCode: 403 })).toBe(
            'the model provider rejected the API key'
        )
    })

    it('names a model the provider no longer serves', () => {
        expect(describeStreamError({ statusCode: 404 })).toBe(
            'the configured model is not available'
        )
    })

    it('treats any 5xx as the provider being down', () => {
        expect(describeStreamError({ statusCode: 503 })).toBe(
            'the model provider is unavailable'
        )
    })

    it('digs the status out of a retry wrapper', () => {
        const retryError = {
            reason: 'maxRetriesExceeded',
            errors: [{ statusCode: 500 }, { statusCode: 429 }],
        }

        expect(describeStreamError(retryError)).toBe(
            'rate limited by the model provider'
        )
    })

    it('falls back rather than throwing on a shape it does not know', () => {
        expect(describeStreamError(new Error('boom'))).toBe(
            'the model call failed'
        )
        expect(describeStreamError(undefined)).toBe('the model call failed')
        expect(describeStreamError({ errors: [] })).toBe(
            'the model call failed'
        )
    })

    it('never forwards the provider text, however tempting', () => {
        const leaky = {
            statusCode: 429,
            message: 'Quota exceeded for metric: ...limit: 20, model: x',
        }

        expect(describeStreamError(leaky)).not.toContain('Quota exceeded')
    })
})
