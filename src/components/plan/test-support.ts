// useObject reads a plain JSON text stream, so the fakes here stand in for
// `fetch` rather than for a ChatTransport.
const responseOf = (stream: ReadableStream<Uint8Array>) =>
    new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    })

const encode = (chunk: string) => new TextEncoder().encode(chunk)

export const fakeJsonFetch =
    (chunks: string[]): typeof globalThis.fetch =>
    async () =>
        responseOf(
            new ReadableStream({
                start(controller) {
                    for (const chunk of chunks)
                        controller.enqueue(encode(chunk))
                    controller.close()
                },
            })
        )

export const controllableJsonFetch = () => {
    let controller: ReadableStreamDefaultController<Uint8Array>
    let calls = 0
    const fetch: typeof globalThis.fetch = async () => {
        calls += 1
        return responseOf(
            new ReadableStream({
                start(c) {
                    controller = c
                },
            })
        )
    }
    return {
        fetch,
        emit: (chunk: string) => controller.enqueue(encode(chunk)),
        close: () => controller.close(),
        callCount: () => calls,
    }
}

export const failingFetch =
    (message = 'boom'): typeof globalThis.fetch =>
    async () => {
        throw new Error(message)
    }
