export type ProviderName = 'anthropic' | 'google'

export type ProviderSpec = {
    name: ProviderName
    /** Env var the provider's own SDK reads; we only check that it is present. */
    apiKeyVar: string
    defaultModel: string
}

/**
 * Order matters: with no explicit AI_PROVIDER, the first spec whose key is set
 * wins, so Anthropic stays the default for anyone who already has that key.
 */
export const providers: ProviderSpec[] = [
    {
        name: 'anthropic',
        apiKeyVar: 'ANTHROPIC_API_KEY',
        defaultModel: 'claude-opus-5',
    },
    {
        name: 'google',
        apiKeyVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
        // Flash rather than Pro: it is the tier Google's free quota is generous
        // with, which is the whole reason this provider is selectable. Pinned a
        // version back from the newest — 3.7-flash answers 503 "high demand"
        // mid-run often enough to break a multi-step tool call.
        defaultModel: 'gemini-3.6-flash',
    },
]

export type Resolution = {
    provider: ProviderSpec
    modelId: string
    apiKeyPresent: boolean
}

const isProviderName = (value: string): value is ProviderName =>
    providers.some((p) => p.name === value)

/**
 * Decides which provider and model a run should use from the environment alone,
 * kept pure so the precedence rules are unit-testable without a live SDK.
 *
 * AI_PROVIDER wins when set; otherwise the first provider with a key present.
 * AI_MODEL overrides the provider's default, so a free-tier account whose quota
 * does not cover the pinned model can point at one that it does.
 */
export const resolveProvider = (
    env: Record<string, string | undefined>
): Resolution => {
    const requested = env.AI_PROVIDER?.trim()

    if (requested && !isProviderName(requested)) {
        throw new Error(
            `AI_PROVIDER must be one of ${providers.map((p) => p.name).join(', ')} — got "${requested}"`
        )
    }

    const provider = requested
        ? providers.find((p) => p.name === requested)!
        : (providers.find((p) => env[p.apiKeyVar]) ?? providers[0])

    return {
        provider,
        modelId: env.AI_MODEL?.trim() || provider.defaultModel,
        apiKeyPresent: Boolean(env[provider.apiKeyVar]),
    }
}

/** The message to print when a resolved provider has no key to call with. */
export const missingKeyMessage = ({ provider }: Resolution) =>
    `${provider.apiKeyVar} is required to reach ${provider.name}. ` +
    `Set it, or select another provider with AI_PROVIDER=${providers
        .filter((p) => p.name !== provider.name)
        .map((p) => p.name)
        .join('|')}.`
