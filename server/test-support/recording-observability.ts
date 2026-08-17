import type {
    FeedbackScore,
    Observability,
    TraceContext,
} from '../observability'

/**
 * Stands in for Langfuse: hands out a predictable trace id and remembers what
 * would have been reported, so routes can be tested without an account.
 */
export const recordingObservability = (traceId = 'trace-1') => {
    const traces: TraceContext[] = []
    const feedback: FeedbackScore[] = []

    const observability: Observability = {
        withTrace: (context, fn) => {
            traces.push(context)
            return fn(traceId)
        },
        recordFeedback: async (score) => {
            feedback.push(score)
        },
    }

    return { observability, traces, feedback }
}
