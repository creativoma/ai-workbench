import { useState } from 'react'
import { ListChecks, Square } from 'lucide-react'
import { useObject } from '@ai-sdk/react'
import { planSchema, renderableSteps } from '../../domain/objects/plan'
import { Card } from '../ui/Card'

type PlanPanelProps = {
    // Injected in tests; the browser default is used in the app.
    fetch?: typeof globalThis.fetch
}

export function PlanPanel({ fetch }: PlanPanelProps) {
    const { submit, object, error, isLoading, stop } = useObject({
        api: '/api/plan',
        schema: planSchema,
        fetch,
    })

    const steps = renderableSteps(object)

    return (
        <section aria-label="Plan">
            <Card
                label="Plan generator"
                title={
                    <span className="flex items-center gap-2">
                        <ListChecks
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="text-ink-400"
                        />
                        Structured output
                    </span>
                }
                actions={
                    isLoading ? (
                        <>
                            <span
                                role="status"
                                className="text-[13px] leading-5 text-ink-500"
                            >
                                Planning…
                            </span>
                            <button
                                type="button"
                                onClick={() => stop()}
                                className="flex h-8 items-center gap-1.5 rounded-md border border-line-300 px-2.5 text-[13px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                            >
                                <Square
                                    size={12}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                    className="fill-current"
                                />
                                Stop
                            </button>
                        </>
                    ) : null
                }
            >
                <GoalForm
                    disabled={isLoading}
                    onSubmit={(goal) => submit({ goal })}
                />

                {object?.goal ? (
                    <h4 className="mt-4 text-[18px] leading-7 font-semibold tracking-[-0.01em] text-ink-950">
                        {object.goal}
                    </h4>
                ) : null}

                {steps.length > 0 ? (
                    <ol
                        aria-label="Steps"
                        className="mt-3 flex flex-col gap-3 border-t border-line-100 pt-3"
                    >
                        {steps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                                <span
                                    aria-hidden="true"
                                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[11px] leading-none text-ink-500"
                                >
                                    {index + 1}
                                </span>
                                <span className="min-w-0">
                                    <strong className="block text-[14px] leading-5 font-medium text-ink-950">
                                        {step.title}
                                    </strong>
                                    {step.detail ? (
                                        <p className="mt-0.5 text-[13px] leading-5 text-ink-700">
                                            {step.detail}
                                        </p>
                                    ) : null}
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : null}

                {error ? (
                    <p
                        role="alert"
                        className="mt-3 text-[13px] leading-5 text-brand-700"
                    >
                        Could not build a plan: {error.message}
                    </p>
                ) : null}
            </Card>
        </section>
    )
}

function GoalForm({
    disabled,
    onSubmit,
}: {
    disabled: boolean
    onSubmit: (goal: string) => void
}) {
    const [goal, setGoal] = useState('')

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                const trimmed = goal.trim()
                if (!trimmed) return
                onSubmit(trimmed)
            }}
            className="flex items-center gap-2"
        >
            <input
                aria-label="Goal"
                value={goal}
                placeholder="Describe a goal"
                onChange={(event) => setGoal(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-line-300 bg-surface-0 px-3 text-[14px] leading-5 text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <button
                type="submit"
                disabled={disabled}
                className="h-9 shrink-0 rounded-md bg-brand-500 px-3.5 text-[14px] leading-5 font-medium text-white transition-colors duration-[120ms] ease-out hover:bg-brand-600 active:bg-brand-700 disabled:bg-surface-2 disabled:text-ink-300"
            >
                Plan
            </button>
        </form>
    )
}
