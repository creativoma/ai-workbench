import { describe, expect, it } from 'vitest'
import { splitFencedCode } from './fenced-code'

describe('splitting fenced code out of assistant text', () => {
    it('returns plain prose untouched', () => {
        expect(splitFencedCode('Just a sentence.')).toEqual([
            { kind: 'prose', text: 'Just a sentence.' },
        ])
    })

    it('returns nothing for empty text', () => {
        expect(splitFencedCode('')).toEqual([])
    })

    it('splits prose, code and trailing prose in order', () => {
        expect(
            splitFencedCode('Before\n```ts\nconst a = 1\n```\nAfter')
        ).toEqual([
            { kind: 'prose', text: 'Before' },
            {
                kind: 'code',
                language: 'ts',
                filename: undefined,
                code: 'const a = 1',
            },
            { kind: 'prose', text: 'After' },
        ])
    })

    it('reads the filename from the info string', () => {
        const [segment] = splitFencedCode('```ts:server/app.ts\nx\n```')

        expect(segment).toEqual({
            kind: 'code',
            language: 'ts',
            filename: 'server/app.ts',
            code: 'x',
        })
    })

    it('accepts a bare fence with no language', () => {
        expect(splitFencedCode('```\nplain\n```')).toEqual([
            { kind: 'code', code: 'plain' },
        ])
    })

    it('emits the partial block while a fence is still open', () => {
        expect(splitFencedCode('Here:\n```ts\nconst a =')).toEqual([
            { kind: 'prose', text: 'Here:' },
            {
                kind: 'code',
                language: 'ts',
                filename: undefined,
                code: 'const a =',
            },
        ])
    })

    it('emits an empty block the moment the fence opens', () => {
        expect(splitFencedCode('```ts\n')).toEqual([
            { kind: 'code', language: 'ts', filename: undefined, code: '' },
        ])
    })

    it('keeps blank lines inside code but drops whitespace-only prose', () => {
        expect(splitFencedCode('```\na\n\nb\n```\n   \n')).toEqual([
            { kind: 'code', code: 'a\n\nb' },
        ])
    })

    it('handles two blocks in one message', () => {
        const segments = splitFencedCode('```js\na\n```\nmid\n```css\nb\n```')

        expect(segments.map((s) => s.kind)).toEqual(['code', 'prose', 'code'])
    })

    it('does not treat inline backticks as a fence', () => {
        expect(splitFencedCode('Use `npm` or ```js inline')).toEqual([
            { kind: 'prose', text: 'Use `npm` or ```js inline' },
        ])
    })
})
