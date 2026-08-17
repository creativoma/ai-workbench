import { z } from 'zod'

// The trace id travels to the browser as assistant-message metadata, which the
// AI SDK types as `unknown` — so it gets parsed rather than trusted.
export const chatMetadataSchema = z.object({
    traceId: z.string().optional(),
})

export type ChatMetadata = z.infer<typeof chatMetadataSchema>

export const traceIdOf = (metadata: unknown): string | undefined =>
    chatMetadataSchema.safeParse(metadata).data?.traceId

export const feedbackRequestSchema = z.object({
    traceId: z.string().min(1, 'traceId is required'),
    rating: z.enum(['up', 'down']),
    comment: z.string().max(500).optional(),
})

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>
export type Rating = FeedbackRequest['rating']

// Langfuse stores this as a numeric score, so a thumb has to become a number.
export const FEEDBACK_SCORE_NAME = 'user-feedback'

export const feedbackScoreValue = (rating: Rating) => (rating === 'up' ? 1 : 0)
