import { simulateReadableStream } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'

const emptyUsage = {
    inputTokens: {
        total: undefined,
        noCache: undefined,
        cacheRead: undefined,
        cacheWrite: undefined,
    },
    outputTokens: {
        total: undefined,
        text: undefined,
        reasoning: undefined,
    },
}

export const finishChunk = {
    type: 'finish' as const,
    finishReason: { unified: 'stop' as const, raw: undefined },
    usage: emptyUsage,
}

export const textChunks = (deltas: string[], id = 'text-1') => [
    { type: 'text-start' as const, id },
    ...deltas.map((delta) => ({ type: 'text-delta' as const, id, delta })),
    { type: 'text-end' as const, id },
]

export const toolCallChunk = (
    toolName: string,
    input: unknown,
    toolCallId = 'call-1'
) => ({
    type: 'tool-call' as const,
    toolCallId,
    toolName,
    input: JSON.stringify(input),
})

export const toolCallsFinishChunk = {
    ...finishChunk,
    finishReason: { unified: 'tool-calls' as const, raw: undefined },
}

type StreamPart =
    Awaited<
        ReturnType<InstanceType<typeof MockLanguageModelV4>['doStream']>
    > extends { stream: ReadableStream<infer P> }
        ? P
        : never

export const stepwiseModel = (steps: StreamPart[][]) => {
    let step = 0
    return new MockLanguageModelV4({
        doStream: async () => {
            const chunks = steps[Math.min(step, steps.length - 1)]
            step += 1
            return { stream: simulateReadableStream({ chunks }) }
        },
    })
}

export const textStreamModel = (deltas: string[]) =>
    new MockLanguageModelV4({
        doStream: async () => ({
            stream: simulateReadableStream({
                chunks: [...textChunks(deltas), finishChunk],
            }),
        }),
    })
