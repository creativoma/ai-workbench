import { describe, expect, it } from 'vitest'
import {
    feedbackRequestSchema,
    feedbackScoreValue,
    traceIdOf,
} from './feedback'

describe('chat metadata', () => {
    it('reads the trace id the server attached', () => {
        expect(traceIdOf({ traceId: 'trace-1' })).toBe('trace-1')
    })

    it('is undefined when telemetry is off and no metadata arrives', () => {
        expect(traceIdOf(undefined)).toBeUndefined()
        expect(traceIdOf({})).toBeUndefined()
    })

    it('ignores metadata of the wrong shape instead of throwing', () => {
        expect(traceIdOf({ traceId: 42 })).toBeUndefined()
        expect(traceIdOf('nonsense')).toBeUndefined()
    })
})

describe('feedback request contract', () => {
    it('accepts a thumbs up for a trace', () => {
        expect(
            feedbackRequestSchema.parse({ traceId: 'trace-1', rating: 'up' })
        ).toEqual({ traceId: 'trace-1', rating: 'up' })
    })

    it('rejects a rating that is not a thumb', () => {
        expect(
            feedbackRequestSchema.safeParse({
                traceId: 'trace-1',
                rating: 'meh',
            }).success
        ).toBe(false)
    })

    it('rejects a missing trace id', () => {
        expect(feedbackRequestSchema.safeParse({ rating: 'up' }).success).toBe(
            false
        )
    })

    it('rejects a comment longer than the score field allows', () => {
        expect(
            feedbackRequestSchema.safeParse({
                traceId: 'trace-1',
                rating: 'down',
                comment: 'x'.repeat(501),
            }).success
        ).toBe(false)
    })
})

describe('feedback score value', () => {
    it('maps a thumbs up to 1 and a thumbs down to 0', () => {
        expect(feedbackScoreValue('up')).toBe(1)
        expect(feedbackScoreValue('down')).toBe(0)
    })
})
