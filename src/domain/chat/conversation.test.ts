import { describe, expect, it } from 'vitest'
import { canSend, isBusy, type ChatStatus } from './conversation'

describe('conversation status rules', () => {
    it.each<[ChatStatus, boolean]>([
        ['ready', true],
        ['error', true],
        ['submitted', false],
        ['streaming', false],
    ])('canSend(%s) → %s', (status, expected) => {
        expect(canSend(status)).toBe(expected)
    })

    it.each<[ChatStatus, boolean]>([
        ['submitted', true],
        ['streaming', true],
        ['ready', false],
        ['error', false],
    ])('isBusy(%s) → %s', (status, expected) => {
        expect(isBusy(status)).toBe(expected)
    })
})
