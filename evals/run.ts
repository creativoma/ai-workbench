import { createApp } from '../server/app'
import { activeProvider, defaultModel } from '../server/infrastructure/model'
import { missingKeyMessage } from '../src/domain/config/provider'
import datasetFile from './dataset.json' with { type: 'json' }
import { datasetSchema, type EvalCase } from '../src/domain/evals/dataset'
import {
    formatSummary,
    isInconclusive,
    isRegression,
    scoreCase,
    summarize,
    type CaseResult,
    type CaseStatus,
} from '../src/domain/evals/scoring'
import { observeStream } from '../src/domain/evals/transcript'

// I/O shell: the dataset, the API call and the printing live here; every
// judgement lives in src/domain/evals and is unit-tested.

const app = createApp({ model: defaultModel })

const runCase = async (evalCase: EvalCase): Promise<CaseResult> => {
    const res = await app.request(
        new Request('http://evals/api/chat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    {
                        id: evalCase.id,
                        role: 'user',
                        parts: [{ type: 'text', text: evalCase.prompt }],
                    },
                ],
            }),
        })
    )

    if (!res.ok) {
        return {
            id: evalCase.id,
            status: 'error',
            failures: [`API returned ${res.status}`],
        }
    }

    return scoreCase(evalCase, observeStream(await res.text()))
}

const label: Record<CaseStatus, string> = {
    pass: 'PASS ',
    fail: 'FAIL ',
    error: 'ERROR',
}

const main = async () => {
    if (!activeProvider.apiKeyPresent) {
        console.error(missingKeyMessage(activeProvider))
        process.exit(1)
    }

    const dataset = datasetSchema.parse(datasetFile)

    // The dataset's expectations were written against Anthropic; print the model
    // so a score is never read without knowing what produced it.
    console.log(
        `model: ${activeProvider.provider.name} / ${activeProvider.modelId}\n`
    )

    // Sequential on purpose: a parallel fan-out trips provider rate limits and
    // turns flaky 429s into fake quality regressions.
    const results: CaseResult[] = []
    for (const evalCase of dataset.cases) {
        const result = await runCase(evalCase)
        results.push(result)
        console.log(
            `${label[result.status]}  ${result.id}` +
                result.failures.map((f) => `\n        ${f}`).join('')
        )
    }

    const summary = summarize(results)
    console.log(`\n${formatSummary(summary, dataset.threshold)}`)

    // Order matters: an inconclusive run has no quality signal to regress on,
    // so it must not be reported as one. Both still fail the build.
    if (isInconclusive(summary)) {
        console.error(
            'Inconclusive: cases never reached the model, so this run says ' +
                'nothing about quality. Re-run once the provider is healthy.'
        )
        process.exit(1)
    }

    if (isRegression(summary, dataset.threshold)) {
        console.error('Quality regression: pass rate below threshold')
        process.exit(1)
    }
}

await main()
