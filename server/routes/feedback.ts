import { Hono } from 'hono'
import type { AppDeps } from '../app'
import { noopObservability } from '../observability'
import { readJson } from './parse-body'
import {
    FEEDBACK_SCORE_NAME,
    feedbackRequestSchema,
    feedbackScoreValue,
} from '../../src/domain/observability/feedback'

export const feedbackRoute = ({ observability }: AppDeps) => {
    const route = new Hono()
    const reporter = observability ?? noopObservability

    route.post('/', async (c) => {
        const body = await readJson(c)
        if (!body.ok) return c.json({ error: 'invalid JSON body' }, 400)

        const request = feedbackRequestSchema.safeParse(body.value)

        if (!request.success) {
            return c.json(
                {
                    error:
                        request.error.issues[0]?.message ?? 'invalid feedback',
                },
                400
            )
        }

        const { traceId, rating, comment } = request.data

        await reporter.recordFeedback({
            traceId,
            name: FEEDBACK_SCORE_NAME,
            value: feedbackScoreValue(rating),
            comment,
        })

        return c.body(null, 204)
    })

    return route
}
