/**
 * What a run actually did, distilled from the UI message stream the chat route
 * returns. Pure so the eval checks can be unit-tested without a model.
 */
export type Observed = {
    text: string
    tools: string[]
    approvalRequested: boolean
    /**
     * Set when the stream carried a failure instead of an answer. The route
     * answers 200 and reports the error *inside* the stream, so without this a
     * run that never reached the model is indistinguishable from one that
     * answered nothing — and gets scored as a quality failure.
     */
    error?: string
}

type Chunk = {
    type?: string
    delta?: string
    toolName?: string
    errorText?: string
}

// The route answers with SSE: one `data: <json>` line per UI message chunk.
const chunksOf = (sse: string): Chunk[] =>
    sse
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).trim())
        .filter((payload) => payload.length > 0 && payload !== '[DONE]')
        .flatMap((payload) => {
            try {
                return [JSON.parse(payload) as Chunk]
            } catch {
                return []
            }
        })

export const observeStream = (sse: string): Observed => {
    const chunks = chunksOf(sse)
    const tools = new Set<string>()
    let text = ''
    let approvalRequested = false
    let error: string | undefined

    for (const chunk of chunks) {
        if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
            text += chunk.delta
        }
        if (chunk.toolName) {
            tools.add(chunk.toolName)
        }
        if (chunk.type?.includes('approval-request')) {
            approvalRequested = true
        }
        // First error wins: later ones are fallout from the same break.
        if (chunk.type === 'error' && error === undefined) {
            error = chunk.errorText || 'the stream reported an error'
        }
    }

    return {
        text,
        tools: [...tools],
        approvalRequested,
        ...(error === undefined ? {} : { error }),
    }
}
