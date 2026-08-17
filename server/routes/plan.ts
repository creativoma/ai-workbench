import { Hono } from 'hono'
import { streamObject } from 'ai'
import type { AppDeps } from '../app'
import { noopObservability } from '../observability'
import { readJson } from './parse-body'
import {
    planPrompt,
    planRequestSchema,
    planSchema,
} from '../../src/domain/objects/plan'

export const planRoute = ({ model, observability }: AppDeps) => {
    const route = new Hono()
    const reporter = observability ?? noopObservability

    route.post('/', async (c) => {
        const body = await readJson(c)
        if (!body.ok) return c.json({ error: 'invalid JSON body' }, 400)

        const request = planRequestSchema.safeParse(body.value)

        if (!request.success) {
            return c.json({ error: 'goal is required' }, 400)
        }

        return reporter.withTrace({ traceName: 'plan' }, () => {
            const result = streamObject({
                model,
                schema: planSchema,
                prompt: planPrompt(request.data),
                telemetry: { functionId: 'plan' },
            })

            // useObject reads a raw JSON text stream, not a UI message stream.
            return result.toTextStreamResponse()
        })
    })

    return route
}
