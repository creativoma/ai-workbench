export type Segment =
    | { kind: 'prose'; text: string }
    | { kind: 'code'; language?: string; filename?: string; code: string }

const FENCE = /^```([^\n`]*)$/

// ```ts, ```ts:server/app.ts, or a bare ```
const parseInfo = (info: string) => {
    const trimmed = info.trim()
    if (!trimmed) return {}
    const [language, filename] = trimmed.split(':')
    return {
        language: language || undefined,
        filename: filename?.trim() || undefined,
    }
}

/**
 * Splits assistant text into prose and fenced code runs.
 *
 * Streaming makes the unterminated fence the normal case, not the edge case: a
 * fence that never closes yields a code segment with whatever has arrived so
 * far, so the card appears as the code is written rather than snapping in at
 * the end.
 */
export const splitFencedCode = (text: string): Segment[] => {
    const segments: Segment[] = []
    let prose: string[] = []
    let code: string[] | null = null
    let info: ReturnType<typeof parseInfo> = {}

    const flushProse = () => {
        const joined = prose.join('\n')
        // Whitespace-only prose between blocks is layout, not content.
        if (joined.trim()) segments.push({ kind: 'prose', text: joined.trim() })
        prose = []
    }

    for (const line of text.split('\n')) {
        const fence = FENCE.exec(line)

        if (fence && code === null) {
            flushProse()
            info = parseInfo(fence[1] ?? '')
            code = []
            continue
        }

        if (fence && code !== null) {
            segments.push({ kind: 'code', ...info, code: code.join('\n') })
            code = null
            info = {}
            continue
        }

        if (code !== null) code.push(line)
        else prose.push(line)
    }

    // Still inside a fence: emit what we have so far.
    if (code !== null) {
        segments.push({ kind: 'code', ...info, code: code.join('\n') })
    } else {
        flushProse()
    }

    return segments
}
