import { describe, expect, it } from 'vitest'
import { weatherInputSchema, weatherOutputSchema } from './weather'

describe('weather tool contract', () => {
    it('accepts a non-empty city', () => {
        const result = weatherInputSchema.safeParse({ city: 'Madrid' })
        expect(result.success).toBe(true)
    })

    it('rejects an empty city', () => {
        expect(weatherInputSchema.safeParse({ city: '' }).success).toBe(false)
    })

    it('rejects a missing city', () => {
        expect(weatherInputSchema.safeParse({}).success).toBe(false)
    })

    it('describes the weather report shape', () => {
        const report = {
            city: 'Madrid',
            temperatureC: 21,
            conditions: 'sunny',
        }
        expect(weatherOutputSchema.safeParse(report).success).toBe(true)
        expect(weatherOutputSchema.safeParse({ city: 'Madrid' }).success).toBe(
            false
        )
    })
})
