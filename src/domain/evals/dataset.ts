import { z } from 'zod'

// What a case asserts. Every check is code — regex or a tool name — so the
// suite is deterministic and needs no judge model to gate CI.
export const expectationSchema = z
    .object({
        /** The run must call these tools. */
        tools: z.array(z.string()).optional(),
        /** The run must not call these tools. */
        forbiddenTools: z.array(z.string()).optional(),
        /** The final answer must match every one of these patterns. */
        matches: z.array(z.string()).optional(),
        /** The run must pause for human approval. */
        requiresApproval: z.boolean().optional(),
    })
    .refine(
        (expectation) =>
            Object.values(expectation).some((v) => v !== undefined),
        { message: 'a case must assert something' }
    )

export const evalCaseSchema = z.object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    expect: expectationSchema,
})

export const datasetSchema = z.object({
    /** Minimum share of passing cases before the run is a regression. */
    threshold: z.number().min(0).max(1),
    cases: z.array(evalCaseSchema).min(1),
})

export type Expectation = z.infer<typeof expectationSchema>
export type EvalCase = z.infer<typeof evalCaseSchema>
export type Dataset = z.infer<typeof datasetSchema>
