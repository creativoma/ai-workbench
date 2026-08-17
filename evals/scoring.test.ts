import { describe, expect, it } from 'vitest'
import dataset from './dataset.json' with { type: 'json' }
import { datasetSchema } from '../src/domain/evals/dataset'
import {
    formatSummary,
    isInconclusive,
    isRegression,
    scoreCase,
    summarize,
    type CaseResult,
} from '../src/domain/evals/scoring'
import { observeStream } from '../src/domain/evals/transcript'

const observed = (over: Partial<ReturnType<typeof observeStream>> = {}) => ({
    text: '',
    tools: [],
    approvalRequested: false,
    ...over,
})

describe('the shipped dataset', () => {
    it('parses and every case asserts something', () => {
        const parsed = datasetSchema.parse(dataset)
        expect(parsed.cases.length).toBeGreaterThanOrEqual(10)
    })

    it('has unique case ids', () => {
        const ids = datasetSchema.parse(dataset).cases.map((c) => c.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('only names tools the server actually exposes', () => {
        const known = ['getWeather', 'sendEmail']
        for (const evalCase of datasetSchema.parse(dataset).cases) {
            for (const tool of [
                ...(evalCase.expect.tools ?? []),
                ...(evalCase.expect.forbiddenTools ?? []),
            ]) {
                expect(known).toContain(tool)
            }
        }
    })
})

describe('dataset validation', () => {
    it('rejects a case that asserts nothing', () => {
        expect(
            datasetSchema.safeParse({
                threshold: 0.8,
                cases: [{ id: 'a', prompt: 'hi', expect: {} }],
            }).success
        ).toBe(false)
    })

    it('rejects an empty case list', () => {
        expect(
            datasetSchema.safeParse({ threshold: 0.8, cases: [] }).success
        ).toBe(false)
    })
})

describe('scoring a case', () => {
    const weatherCase = {
        id: 'weather',
        prompt: 'weather in Madrid?',
        expect: { tools: ['getWeather'], matches: ['21'] },
    }

    it('passes when the tool ran and the answer matches', () => {
        expect(
            scoreCase(
                weatherCase,
                observed({ tools: ['getWeather'], text: 'It is 21°C' })
            )
        ).toEqual({ id: 'weather', status: 'pass', failures: [] })
    })

    it('fails and names the missing tool', () => {
        const result = scoreCase(weatherCase, observed({ text: 'It is 21°C' }))

        expect(result.status).toBe('fail')
        expect(result.failures[0]).toContain('getWeather')
    })

    it('fails when the answer does not match the pattern', () => {
        const result = scoreCase(
            weatherCase,
            observed({ tools: ['getWeather'], text: 'It is warm' })
        )

        expect(result.status).toBe('fail')
        expect(result.failures[0]).toContain('/21/i')
    })

    it('matches patterns case-insensitively', () => {
        expect(
            scoreCase(
                { id: 'c', prompt: 'p', expect: { matches: ['paris'] } },
                observed({ text: 'The capital is Paris.' })
            ).status
        ).toBe('pass')
    })

    it('flags a forbidden tool that was called anyway', () => {
        const result = scoreCase(
            { id: 'c', prompt: 'p', expect: { forbiddenTools: ['sendEmail'] } },
            observed({ tools: ['sendEmail'] })
        )

        expect(result.status).toBe('fail')
        expect(result.failures[0]).toContain('sendEmail')
    })

    it('requires an approval pause when the case asks for one', () => {
        const approvalCase = {
            id: 'c',
            prompt: 'p',
            expect: { requiresApproval: true },
        }

        expect(
            scoreCase(approvalCase, observed({ approvalRequested: true }))
                .status
        ).toBe('pass')
        expect(scoreCase(approvalCase, observed()).status).toBe('fail')
    })

    it('flags an approval pause the case forbids', () => {
        expect(
            scoreCase(
                { id: 'c', prompt: 'p', expect: { requiresApproval: false } },
                observed({ approvalRequested: true })
            ).status
        ).toBe('fail')
    })

    it('reports every failure at once rather than stopping at the first', () => {
        const result = scoreCase(weatherCase, observed({ text: 'no idea' }))
        expect(result.failures).toHaveLength(2)
    })

    it('errors rather than fails when the run never reached the model', () => {
        // The regression this whole distinction exists for: a spent quota
        // leaves an empty transcript that looks exactly like a bad answer.
        const result = scoreCase(
            weatherCase,
            observed({ error: 'rate limited by the model provider' })
        )

        expect(result.status).toBe('error')
        expect(result.failures).toEqual([
            'never reached the model: rate limited by the model provider',
        ])
    })

    it('does not report expectations against a transcript it never got', () => {
        const result = scoreCase(weatherCase, observed({ error: 'boom' }))

        expect(result.failures.join()).not.toContain('getWeather')
    })
})

describe('summarising a run', () => {
    const pass: CaseResult = { id: 'a', status: 'pass', failures: [] }
    const fail: CaseResult = { id: 'b', status: 'fail', failures: ['nope'] }
    const errored: CaseResult = { id: 'c', status: 'error', failures: ['429'] }

    it('counts passes and computes a rate', () => {
        expect(summarize([pass, pass, fail, fail])).toEqual({
            total: 4,
            scored: 4,
            passed: 2,
            failed: 2,
            errored: 0,
            passRate: 0.5,
        })
    })

    it('keeps errored cases out of the rate instead of dragging it down', () => {
        // 9 pass / 3 error is the run that reported 75% and cried regression.
        const summary = summarize([pass, pass, pass, errored])

        expect(summary.passRate).toBe(1)
        expect(summary.scored).toBe(3)
        expect(summary.total).toBe(4)
        expect(isRegression(summary, 0.8)).toBe(false)
    })

    it('calls a run with any errored case inconclusive', () => {
        expect(isInconclusive(summarize([pass, pass, pass, errored]))).toBe(
            true
        )
        expect(isInconclusive(summarize([pass, fail]))).toBe(false)
    })

    it('treats an empty run as inconclusive, not a perfect score', () => {
        expect(summarize([]).passRate).toBe(0)
        expect(isInconclusive(summarize([]))).toBe(true)
        // Nothing was scored, so there is no quality claim to regress on.
        expect(isRegression(summarize([]), 0.8)).toBe(false)
    })

    it('regresses strictly below the threshold and passes at it', () => {
        expect(isRegression(summarize([pass, fail]), 0.8)).toBe(true)
        expect(isRegression(summarize([pass, pass]), 1)).toBe(false)
    })

    it('formats a readable line for CI logs', () => {
        expect(formatSummary(summarize([pass, fail]), 0.8)).toBe(
            '1/2 passed (50%, threshold 80%)'
        )
    })

    it('says how many cases went unscored, so 100% is not read as clean', () => {
        expect(formatSummary(summarize([pass, errored]), 0.8)).toBe(
            '1/1 passed (100%, threshold 80%); 1 of 2 never reached the model and went unscored'
        )
    })
})

describe('observing a stream', () => {
    const sse = (chunks: unknown[]) =>
        chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('')

    it('reassembles the answer from its deltas', () => {
        expect(
            observeStream(
                sse([
                    { type: 'text-delta', delta: 'It is ' },
                    { type: 'text-delta', delta: '21°C' },
                ])
            ).text
        ).toBe('It is 21°C')
    })

    it('collects each tool once', () => {
        expect(
            observeStream(
                sse([
                    { type: 'tool-input-start', toolName: 'getWeather' },
                    { type: 'tool-input-available', toolName: 'getWeather' },
                ])
            ).tools
        ).toEqual(['getWeather'])
    })

    it('notices an approval request', () => {
        expect(
            observeStream(sse([{ type: 'tool-approval-request' }]))
                .approvalRequested
        ).toBe(true)
    })

    it('ignores keep-alives and unparsable lines instead of throwing', () => {
        expect(
            observeStream(
                ': keep-alive\ndata: [DONE]\ndata: {oops\ndata: {"type":"text-delta","delta":"ok"}\n'
            )
        ).toEqual({ text: 'ok', tools: [], approvalRequested: false })
    })

    it('returns an empty observation for an empty body', () => {
        expect(observeStream('')).toEqual({
            text: '',
            tools: [],
            approvalRequested: false,
        })
    })

    it('captures the error the stream carried instead of an answer', () => {
        // What a 429 actually looks like on the wire: HTTP 200, then this.
        const observation = observeStream(
            sse([
                { type: 'start' },
                {
                    type: 'error',
                    errorText: 'rate limited by the model provider',
                },
            ])
        )

        expect(observation.error).toBe('rate limited by the model provider')
    })

    it('keeps the first error, not the fallout that follows it', () => {
        expect(
            observeStream(
                sse([
                    { type: 'error', errorText: 'first' },
                    { type: 'error', errorText: 'second' },
                ])
            ).error
        ).toBe('first')
    })

    it('still marks an error the route left untitled', () => {
        expect(observeStream(sse([{ type: 'error' }])).error).toBe(
            'the stream reported an error'
        )
    })

    it('leaves error unset on a clean run, so absence means success', () => {
        expect(
            observeStream(sse([{ type: 'text-delta', delta: 'hi' }])).error
        ).toBeUndefined()
    })
})
