// The port the routes depend on. Keeping Langfuse behind it means the app runs
// (and the suite passes) with no Langfuse account, and tests can assert on what
// would have been reported.
export type TraceContext = {
    traceName: string
    sessionId?: string
    userId?: string
}

export type FeedbackScore = {
    traceId: string
    name: string
    value: number
    comment?: string
}

export type Observability = {
    /**
     * Runs `fn` inside a trace. The trace id is handed to the callback so the
     * route can ship it to the browser, and is `undefined` when tracing is off.
     */
    withTrace: <T>(context: TraceContext, fn: (traceId?: string) => T) => T
    recordFeedback: (score: FeedbackScore) => Promise<void>
}

export const noopObservability: Observability = {
    withTrace: (_context, fn) => fn(undefined),
    recordFeedback: async () => {},
}
