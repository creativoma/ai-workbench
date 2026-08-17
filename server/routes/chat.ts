import { Hono } from 'hono'
import { z } from 'zod'
import {
    convertToModelMessages,
    isStepCount,
    safeValidateUIMessages,
    streamText,
} from 'ai'
import type { AppDeps } from '../app'
import { noopObservability } from '../observability'
import { readJson } from './parse-body'
import { getWeather } from '../tools/weather'
import { sendEmail } from '../tools/email'
import { describeStreamError } from '../../src/domain/api/stream-error'

const tools = { getWeather, sendEmail }

// The envelope; `messages` is handed to the AI SDK's own validator, which knows
// the UIMessage part shapes far better than a schema we'd maintain here.
const chatRequestSchema = z.object({
    messages: z.array(z.unknown()).min(1, 'messages is required'),
    sessionId: z.string().max(200).optional(),
})

export const chatRoute = ({ model, observability }: AppDeps) => {
    const route = new Hono()
    const reporter = observability ?? noopObservability

    route.post('/', async (c) => {
        const body = await readJson(c)
        if (!body.ok) return c.json({ error: 'invalid JSON body' }, 400)

        const envelope = chatRequestSchema.safeParse(body.value)
        if (!envelope.success) {
            return c.json(
                {
                    error:
                        envelope.error.issues[0]?.message ?? 'invalid request',
                },
                400
            )
        }

        // Structure only: tool inputs get validated against each tool's own
        // Zod schema when the model calls it, so they aren't re-declared here.
        const validated = await safeValidateUIMessages({
            messages: envelope.data.messages,
        })
        if (!validated.success) {
            return c.json({ error: 'invalid messages' }, 400)
        }

        const modelMessages = await convertToModelMessages(validated.data, {
            tools,
        })

        return reporter.withTrace(
            { traceName: 'chat', sessionId: envelope.data.sessionId },
            (traceId) => {
                const result = streamText({
                    model,
                    messages: modelMessages,
                    tools,
                    stopWhen: isStepCount(5),
                    telemetry: { functionId: 'chat' },
                })

                return result.toUIMessageStreamResponse({
                    // Rides along as assistant-message metadata so the browser
                    // can score this exact trace when the user votes.
                    messageMetadata: ({ part }) =>
                        part.type === 'start' && traceId
                            ? { traceId }
                            : undefined,
                    // The default masks every failure as "An error occurred.",
                    // which reads the same as a bad answer. This says which kind
                    // of failure it was without forwarding the provider's text.
                    onError: describeStreamError,
                })
            }
        )
    })

    return route
}
