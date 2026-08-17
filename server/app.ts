import { Hono } from 'hono'
import type { LanguageModel } from 'ai'
import { chatRoute } from './routes/chat'
import { feedbackRoute } from './routes/feedback'
import { planRoute } from './routes/plan'
import { noopObservability, type Observability } from './observability'
import { rateLimit, type RateLimitOptions } from './middleware/rate-limit'

export type AppDeps = {
    model: LanguageModel
    observability?: Observability
    /** Omit to leave the API unthrottled — which is what most tests want. */
    rateLimit?: RateLimitOptions
}

type ResolvedDeps = AppDeps & { observability: Observability }

export const createApp = (deps: AppDeps) => {
    const resolved: ResolvedDeps = {
        ...deps,
        observability: deps.observability ?? noopObservability,
    }
    const app = new Hono()

    // Model calls are the expensive part, so the limit guards /api/* rather
    // than each route deciding for itself.
    if (deps.rateLimit) {
        app.use('/api/*', rateLimit(deps.rateLimit))
    }

    app.route('/api/chat', chatRoute(resolved))
    app.route('/api/plan', planRoute(resolved))
    app.route('/api/feedback', feedbackRoute(resolved))
    return app
}

export type App = ReturnType<typeof createApp>
