import { z } from 'zod'

export const emailInputSchema = z.object({
    to: z.email(),
    subject: z.string(),
    body: z.string(),
})

export type EmailDraft = z.infer<typeof emailInputSchema>

export type EmailApprovalPolicy = {
    trustedDomain: string
}

export const emailNeedsApproval = (
    draft: EmailDraft,
    { trustedDomain }: EmailApprovalPolicy
) => {
    const recipientDomain = draft.to.split('@').at(-1)
    return recipientDomain !== trustedDomain
}
