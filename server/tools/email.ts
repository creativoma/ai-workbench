import { tool } from 'ai'
import {
    emailInputSchema,
    emailNeedsApproval,
} from '../../src/domain/tools/email'

const policy = { trustedDomain: 'asafedigital.com' }

// Demo implementation: pretends to deliver instead of hitting a real mail API.
export const sendEmail = tool({
    description: 'Send an email to a recipient',
    inputSchema: emailInputSchema,
    needsApproval: (draft) => emailNeedsApproval(draft, policy),
    execute: async (draft) => ({ delivered: true, to: draft.to }),
})
