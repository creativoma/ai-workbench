import { describe, expect, it } from 'vitest'
import { missingKeyMessage, resolveProvider } from './provider'

describe('provider resolution', () => {
    it('picks the provider whose key is present', () => {
        const { provider, apiKeyPresent } = resolveProvider({
            GOOGLE_GENERATIVE_AI_API_KEY: 'key',
        })

        expect(provider.name).toBe('google')
        expect(apiKeyPresent).toBe(true)
    })

    it('prefers Anthropic when both keys are present', () => {
        const { provider } = resolveProvider({
            ANTHROPIC_API_KEY: 'key',
            GOOGLE_GENERATIVE_AI_API_KEY: 'key',
        })

        expect(provider.name).toBe('anthropic')
    })

    it('lets AI_PROVIDER override the key that happens to be set', () => {
        const { provider, apiKeyPresent } = resolveProvider({
            AI_PROVIDER: 'google',
            ANTHROPIC_API_KEY: 'key',
        })

        expect(provider.name).toBe('google')
        // Selected on request, but there is nothing to call it with.
        expect(apiKeyPresent).toBe(false)
    })

    it('rejects an unknown AI_PROVIDER rather than falling back silently', () => {
        expect(() => resolveProvider({ AI_PROVIDER: 'openai' })).toThrow(
            /AI_PROVIDER must be one of/
        )
    })

    it('falls back to Anthropic when nothing is configured', () => {
        const { provider, apiKeyPresent, modelId } = resolveProvider({})

        expect(provider.name).toBe('anthropic')
        expect(apiKeyPresent).toBe(false)
        expect(modelId).toBe('claude-opus-5')
    })

    it('uses the provider default model', () => {
        expect(resolveProvider({ AI_PROVIDER: 'google' }).modelId).toBe(
            'gemini-3.6-flash'
        )
    })

    it('lets AI_MODEL override the default, for quotas the pin does not fit', () => {
        const { modelId } = resolveProvider({
            AI_PROVIDER: 'google',
            AI_MODEL: 'gemini-flash-latest',
        })

        expect(modelId).toBe('gemini-flash-latest')
    })

    it('ignores a blank AI_MODEL instead of asking for an empty model', () => {
        const { modelId } = resolveProvider({
            AI_PROVIDER: 'google',
            AI_MODEL: '   ',
        })

        expect(modelId).toBe('gemini-3.6-flash')
    })

    it('names the missing key and the way out', () => {
        const message = missingKeyMessage(
            resolveProvider({ AI_PROVIDER: 'google' })
        )

        expect(message).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
        expect(message).toContain('AI_PROVIDER=anthropic')
    })
})
