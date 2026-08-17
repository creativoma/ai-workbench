import { registerTelemetry } from 'ai'
import { LangfuseClient } from '@langfuse/client'
import { LangfuseSpanProcessor } from '@langfuse/otel'
import { LangfuseVercelAiSdkIntegration } from '@langfuse/vercel-ai-sdk'
import {
    getActiveTraceId,
    propagateAttributes,
    startActiveObservation,
} from '@langfuse/tracing'
import { NodeSDK } from '@opentelemetry/sdk-node'
import type { Observability } from './index'

export const langfuseConfigured = () =>
    Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY)

/**
 * Must run before the first model call: the AI SDK integration only creates
 * spans, and the span processor is what ships them to Langfuse.
 */
export const startTelemetry = () => {
    const sdk = new NodeSDK({ spanProcessors: [new LangfuseSpanProcessor()] })
    sdk.start()
    // AI SDK v7 traces through a registered integration rather than the
    // per-call `experimental_telemetry` flag used by v6 and earlier.
    registerTelemetry(new LangfuseVercelAiSdkIntegration())
    return sdk
}

export const langfuseObservability = (): Observability => {
    const client = new LangfuseClient()

    return {
        withTrace: (context, fn) =>
            // propagateAttributes tags every span in the context; the enclosing
            // observation is what gives us an id to hang scores off later.
            propagateAttributes(
                {
                    traceName: context.traceName,
                    sessionId: context.sessionId,
                    userId: context.userId,
                },
                () =>
                    startActiveObservation(context.traceName, () =>
                        fn(getActiveTraceId())
                    )
            ),

        recordFeedback: async ({ traceId, name, value, comment }) => {
            client.score.create({
                traceId,
                name,
                value,
                comment,
                dataType: 'NUMERIC',
            })
            // The request is about to end, so don't wait for the batch timer.
            await client.score.flush()
        },
    }
}
