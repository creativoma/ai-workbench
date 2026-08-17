import { createApp } from './app'
import { activeProvider, defaultModel } from './infrastructure/model'
import { noopObservability } from './observability'
import { missingKeyMessage } from '../src/domain/config/provider'
import {
    langfuseConfigured,
    langfuseObservability,
    startTelemetry,
} from './observability/langfuse'

// Telemetry has to be registered before the first model call, so this runs at
// import time rather than per request. Without Langfuse keys the app runs
// untraced instead of failing.
const traced = langfuseConfigured()

if (traced) {
    startTelemetry()
} else {
    console.warn(
        'LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY unset — running without tracing'
    )
}

// Warn rather than exit: the shell, the routes and the E2E stubs all work
// without a key, and only a real model call fails.
if (activeProvider.apiKeyPresent) {
    console.log(
        `model: ${activeProvider.provider.name} / ${activeProvider.modelId}`
    )
} else {
    console.warn(missingKeyMessage(activeProvider))
}

const app = createApp({
    model: defaultModel,
    observability: traced ? langfuseObservability() : noopObservability,
    // Enough headroom for a real conversation, low enough that a runaway client
    // can't bill through the API key.
    rateLimit: { limit: 30, windowMs: 60_000 },
})

export default {
    fetch: app.fetch,
    port: 8787,
}
