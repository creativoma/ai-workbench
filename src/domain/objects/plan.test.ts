import { describe, expect, it } from 'vitest'
import {
    planPrompt,
    planRequestSchema,
    planSchema,
    renderableSteps,
} from './plan'

describe('plan request contract', () => {
    it('accepts a non-empty goal', () => {
        expect(planRequestSchema.parse({ goal: 'Ship the API' })).toEqual({
            goal: 'Ship the API',
        })
    })

    it('rejects an empty goal', () => {
        expect(planRequestSchema.safeParse({ goal: '' }).success).toBe(false)
    })

    it('rejects a missing goal', () => {
        expect(planRequestSchema.safeParse({}).success).toBe(false)
    })
})

describe('plan shape', () => {
    it('describes a goal plus ordered steps', () => {
        const plan = {
            goal: 'Ship the API',
            steps: [{ title: 'Design', detail: 'Sketch the routes.' }],
        }

        expect(planSchema.parse(plan)).toEqual(plan)
    })

    it('rejects a step missing its detail', () => {
        expect(
            planSchema.safeParse({
                goal: 'Ship the API',
                steps: [{ title: 'Design' }],
            }).success
        ).toBe(false)
    })
})

describe('renderable steps while streaming', () => {
    it('is empty before anything has arrived', () => {
        expect(renderableSteps(undefined)).toEqual([])
        expect(renderableSteps({})).toEqual([])
    })

    it('skips the half-written tail step that has no title yet', () => {
        expect(
            renderableSteps({
                goal: 'Ship the API',
                steps: [{ title: 'Design', detail: 'Sketch it.' }, {}],
            })
        ).toEqual([{ title: 'Design', detail: 'Sketch it.' }])
    })

    it('renders a titled step whose detail is still streaming', () => {
        expect(renderableSteps({ steps: [{ title: 'Design' }] })).toEqual([
            { title: 'Design', detail: '' },
        ])
    })

    it('tolerates sparse holes in the streamed array', () => {
        expect(
            renderableSteps({
                steps: [undefined, { title: 'Build', detail: 'Write it.' }],
            })
        ).toEqual([{ title: 'Build', detail: 'Write it.' }])
    })
})

describe('plan prompt', () => {
    it('carries the goal to the model', () => {
        expect(planPrompt({ goal: 'Ship the API' })).toContain('Ship the API')
    })
})
