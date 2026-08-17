import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai'

const streamOf = (chunks: UIMessageChunk[]) =>
    new ReadableStream<UIMessageChunk>({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(chunk)
            controller.close()
        },
    })

export const fakeTransport = (
    chunks: UIMessageChunk[]
): ChatTransport<UIMessage> => ({
    sendMessages: async () => streamOf(chunks),
    reconnectToStream: async () => null,
})

export const controllableTransport = () => {
    let controller: ReadableStreamDefaultController<UIMessageChunk>
    let calls = 0
    const transport: ChatTransport<UIMessage> = {
        sendMessages: async () => {
            calls += 1
            return new ReadableStream<UIMessageChunk>({
                start(c) {
                    controller = c
                },
            })
        },
        reconnectToStream: async () => null,
    }
    return {
        transport,
        emit: (chunk: UIMessageChunk) => controller.enqueue(chunk),
        close: () => controller.close(),
        callCount: () => calls,
    }
}

export const failingThenSucceedingTransport = (chunks: UIMessageChunk[]) => {
    let calls = 0
    const transport: ChatTransport<UIMessage> = {
        sendMessages: async () => {
            calls += 1
            if (calls === 1) throw new Error('boom')
            return new ReadableStream<UIMessageChunk>({
                start(controller) {
                    for (const chunk of chunks) controller.enqueue(chunk)
                    controller.close()
                },
            })
        },
        reconnectToStream: async () => null,
    }
    return { transport, callCount: () => calls }
}

export const countingTransport = (
    chunksPerCall: UIMessageChunk[][],
    maxCalls = 4
) => {
    let calls = 0
    const transport: ChatTransport<UIMessage> = {
        sendMessages: async () => {
            const chunks =
                chunksPerCall[Math.min(calls, chunksPerCall.length - 1)]
            calls += 1
            if (calls > maxCalls) {
                throw new Error(
                    `runaway auto-send: ${calls} requests (max ${maxCalls})`
                )
            }
            return new ReadableStream<UIMessageChunk>({
                start(controller) {
                    for (const chunk of chunks) controller.enqueue(chunk)
                    controller.close()
                },
            })
        },
        reconnectToStream: async () => null,
    }
    return { transport, callCount: () => calls }
}

export const assistantTextChunks = (deltas: string[]): UIMessageChunk[] => [
    { type: 'start' },
    { type: 'start-step' },
    { type: 'text-start', id: 't1' },
    ...deltas.map((delta): UIMessageChunk => ({
        type: 'text-delta',
        id: 't1',
        delta,
    })),
    { type: 'text-end', id: 't1' },
    { type: 'finish-step' },
    { type: 'finish' },
]

// Mirrors what the server streams after an approval is granted: the tool
// output closes its own step, then the final answer starts a new one.
export const toolOutputThenTextChunks = (
    toolCallId: string,
    output: unknown,
    deltas: string[]
): UIMessageChunk[] => [
    { type: 'start' },
    { type: 'start-step' },
    { type: 'tool-output-available', toolCallId, output },
    { type: 'finish-step' },
    { type: 'start-step' },
    { type: 'text-start', id: 't2' },
    ...deltas.map((delta): UIMessageChunk => ({
        type: 'text-delta',
        id: 't2',
        delta,
    })),
    { type: 'text-end', id: 't2' },
    { type: 'finish-step' },
    { type: 'finish' },
]
