import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { textStreamModel } from '../test-support/mock-model'
import { recordingObservability } from '../test-support/recording-observability'

const feedbackRequest = (body: unknown) =>
    new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })

const appWith = (recorder = recordingObservability()) => ({
    app: createApp({
        model: textStreamModel(['hi']),
        observability: recorder.observability,
    }),
    recorder,
})

describe('POST /api/feedback', () => {
    it('records a thumbs up as a numeric score of 1', async () => {
        const { app, recorder } = appWith()

        const res = await app.request(
            feedbackRequest({ traceId: 'trace-1', rating: 'up' })
        )

        expect(res.status).toBe(204)
        expect(recorder.feedback).toEqual([
            {
                traceId: 'trace-1',
                name: 'user-feedback',
                value: 1,
                comment: undefined,
            },
        ])
    })

    it('records a thumbs down with its comment', async () => {
        const { app, recorder } = appWith()

        const res = await app.request(
            feedbackRequest({
                traceId: 'trace-9',
                rating: 'down',
                comment: 'wrong city',
            })
        )

        expect(res.status).toBe(204)
        expect(recorder.feedback[0]).toEqual({
            traceId: 'trace-9',
            name: 'user-feedback',
            value: 0,
            comment: 'wrong city',
        })
    })

    it('rejects an unknown rating without reporting anything', async () => {
        const { app, recorder } = appWith()

        const res = await app.request(
            feedbackRequest({ traceId: 'trace-1', rating: 'sideways' })
        )

        expect(res.status).toBe(400)
        expect(recorder.feedback).toEqual([])
    })

    it('rejects feedback with no trace to attach it to', async () => {
        const { app, recorder } = appWith()

        const res = await app.request(feedbackRequest({ rating: 'up' }))

        expect(res.status).toBe(400)
        expect(recorder.feedback).toEqual([])
    })
})
