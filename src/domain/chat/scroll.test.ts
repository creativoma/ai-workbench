import { describe, expect, it } from 'vitest'
import { shouldStickToBottom } from './scroll'

const at = (scrollTop: number) => ({
    scrollTop,
    scrollHeight: 1000,
    clientHeight: 400,
})

describe('following the newest message', () => {
    it('sticks when parked on the floor', () => {
        expect(shouldStickToBottom(at(600))).toBe(true)
    })

    it('sticks while within the threshold of the floor', () => {
        expect(shouldStickToBottom(at(500))).toBe(true)
    })

    it('lets go once the reader scrolls up past the threshold', () => {
        expect(shouldStickToBottom(at(400))).toBe(false)
        expect(shouldStickToBottom(at(0))).toBe(false)
    })

    it('treats the threshold as inclusive', () => {
        // Exactly 120px from the floor.
        expect(shouldStickToBottom(at(480), 120)).toBe(true)
        expect(shouldStickToBottom(at(479), 120)).toBe(false)
    })

    it('sticks when the content does not overflow at all', () => {
        expect(
            shouldStickToBottom({
                scrollTop: 0,
                scrollHeight: 300,
                clientHeight: 400,
            })
        ).toBe(true)
    })

    it('honours a custom threshold', () => {
        expect(shouldStickToBottom(at(300), 300)).toBe(true)
        expect(shouldStickToBottom(at(300), 10)).toBe(false)
    })
})
