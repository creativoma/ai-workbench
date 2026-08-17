import type { EvalCase } from './dataset'
import type { Observed } from './transcript'

/**
 * `error` is deliberately not a kind of `fail`: a case that never reached the
 * model carries no information about quality, and counting it as a failure is
 * how a spent quota gets reported as a regression.
 */
export type CaseStatus = 'pass' | 'fail' | 'error'

export type CaseResult = {
    id: string
    status: CaseStatus
    /** Why it failed, or what the run reported instead of an answer. */
    failures: string[]
}

export type Summary = {
    total: number
    /** Cases that produced a verdict — the pass-rate denominator. */
    scored: number
    passed: number
    failed: number
    errored: number
    passRate: number
}

export const scoreCase = (
    evalCase: EvalCase,
    observed: Observed
): CaseResult => {
    // Short-circuit: an empty transcript would otherwise report every
    // expectation as a content failure, which is a lie about the model.
    if (observed.error !== undefined) {
        return {
            id: evalCase.id,
            status: 'error',
            failures: [`never reached the model: ${observed.error}`],
        }
    }

    const failures: string[] = []
    const { tools, forbiddenTools, matches, requiresApproval } = evalCase.expect

    for (const tool of tools ?? []) {
        if (!observed.tools.includes(tool)) {
            failures.push(
                `expected tool ${tool}; called [${observed.tools.join(', ') || 'none'}]`
            )
        }
    }

    for (const tool of forbiddenTools ?? []) {
        if (observed.tools.includes(tool)) {
            failures.push(`tool ${tool} should not have been called`)
        }
    }

    for (const pattern of matches ?? []) {
        if (!new RegExp(pattern, 'i').test(observed.text)) {
            failures.push(`answer did not match /${pattern}/i`)
        }
    }

    if (requiresApproval !== undefined) {
        if (requiresApproval && !observed.approvalRequested) {
            failures.push('expected the run to request approval')
        }
        if (!requiresApproval && observed.approvalRequested) {
            failures.push('run requested approval but should not have')
        }
    }

    return {
        id: evalCase.id,
        status: failures.length === 0 ? 'pass' : 'fail',
        failures,
    }
}

export const summarize = (results: CaseResult[]): Summary => {
    const count = (status: CaseStatus) =>
        results.filter((result) => result.status === status).length

    const passed = count('pass')
    const failed = count('fail')
    const errored = count('error')
    const scored = passed + failed

    return {
        total: results.length,
        scored,
        passed,
        failed,
        errored,
        // An unscored run is a broken run, not a perfect one.
        passRate: scored === 0 ? 0 : passed / scored,
    }
}

/**
 * A verdict on quality, and only that. Errored cases are excluded from the rate
 * rather than dragging it down, so this answers "did the model get worse?"
 * instead of "did anything go wrong?".
 */
export const isRegression = (summary: Summary, threshold: number) =>
    summary.scored > 0 && summary.passRate < threshold

/**
 * True when the run cannot support a verdict at all. Still a non-zero exit for
 * CI — a run that did not happen must not read as a green build — but it is not
 * a regression, and saying so is the whole point of the distinction.
 */
export const isInconclusive = (summary: Summary) =>
    summary.errored > 0 || summary.scored === 0

export const formatSummary = (summary: Summary, threshold: number) =>
    `${summary.passed}/${summary.scored} passed ` +
    `(${(summary.passRate * 100).toFixed(0)}%, threshold ${(threshold * 100).toFixed(0)}%)` +
    (summary.errored > 0
        ? `; ${summary.errored} of ${summary.total} never reached the model and went unscored`
        : '')
