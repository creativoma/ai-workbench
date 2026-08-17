import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import {
    resolveProvider,
    type ProviderName,
    type Resolution,
} from '../../src/domain/config/provider'

// Thin shell: which provider to use is decided by the pure rule in
// src/domain/config/provider.ts; this only turns that answer into an SDK call.
const constructors: Record<ProviderName, (modelId: string) => LanguageModel> = {
    anthropic: (modelId) => anthropic(modelId),
    google: (modelId) => google(modelId),
}

export const activeProvider: Resolution = resolveProvider(process.env)

export const defaultModel: LanguageModel = constructors[
    activeProvider.provider.name
](activeProvider.modelId)
