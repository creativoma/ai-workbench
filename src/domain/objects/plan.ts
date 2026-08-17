import { z } from 'zod'

// Shared between server (streamObject) and client (useObject) — the single
// source of truth for the structured output.
export const planStepSchema = z.object({
    title: z.string(),
    detail: z.string(),
})

export const planSchema = z.object({
    goal: z.string(),
    steps: z.array(planStepSchema),
})

export const planRequestSchema = z.object({
    goal: z.string().min(1, 'goal is required'),
})

export type PlanStep = z.infer<typeof planStepSchema>
export type Plan = z.infer<typeof planSchema>
export type PlanRequest = z.infer<typeof planRequestSchema>

// While the object streams in, every field is optional and the tail of the
// array is half-written. A step is only worth rendering once it has a title.
type PartialPlan = {
    goal?: string
    steps?: ({ title?: string; detail?: string } | undefined)[]
}

export const renderableSteps = (plan: PartialPlan | undefined): PlanStep[] =>
    (plan?.steps ?? []).flatMap((step) =>
        step?.title ? [{ title: step.title, detail: step.detail ?? '' }] : []
    )

export const planPrompt = ({ goal }: PlanRequest) =>
    `Break the following goal into 3 to 5 ordered, concrete steps. ` +
    `Give each step a short title and one sentence of detail.\n\nGoal: ${goal}`
