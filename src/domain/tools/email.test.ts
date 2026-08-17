import { describe, expect, it } from 'vitest'
import { emailInputSchema, emailNeedsApproval } from './email'

describe('email tool contract', () => {
    it('accepts a valid draft', () => {
        const draft = {
            to: 'ana@example.com',
            subject: 'Hola',
            body: 'Contenido',
        }
        expect(emailInputSchema.safeParse(draft).success).toBe(true)
    })

    it('rejects an invalid recipient address', () => {
        const draft = { to: 'no-es-un-email', subject: 'x', body: 'y' }
        expect(emailInputSchema.safeParse(draft).success).toBe(false)
    })
})

describe('email approval policy', () => {
    const policy = { trustedDomain: 'asafedigital.com' }

    it('requires approval for recipients outside the trusted domain', () => {
        const draft = { to: 'ana@example.com', subject: 'x', body: 'y' }
        expect(emailNeedsApproval(draft, policy)).toBe(true)
    })

    it('does not require approval inside the trusted domain', () => {
        const draft = { to: 'ana@asafedigital.com', subject: 'x', body: 'y' }
        expect(emailNeedsApproval(draft, policy)).toBe(false)
    })

    it('matches the trusted domain exactly, not as a suffix', () => {
        const draft = {
            to: 'ana@evil-asafedigital.com',
            subject: 'x',
            body: 'y',
        }
        expect(emailNeedsApproval(draft, policy)).toBe(true)
    })
})
