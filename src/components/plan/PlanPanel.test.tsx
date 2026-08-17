import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlanPanel } from './PlanPanel'
import {
    controllableJsonFetch,
    failingFetch,
    fakeJsonFetch,
} from './test-support'

const wholePlan = [
    '{"goal":"Ship the API","steps":[',
    '{"title":"Design","detail":"Sketch the routes."},',
    '{"title":"Build","detail":"Implement the handlers."}]}',
]

const askForAPlan = async () => {
    await userEvent.type(screen.getByRole('textbox'), 'Ship the API')
    await userEvent.click(screen.getByRole('button', { name: /plan/i }))
}

describe('structured plan rendering', () => {
    it('renders every step of the completed object', async () => {
        render(<PlanPanel fetch={fakeJsonFetch(wholePlan)} />)

        await askForAPlan()

        const steps = await screen.findByRole('list', { name: /steps/i })
        await waitFor(() =>
            expect(steps.querySelectorAll('li')).toHaveLength(2)
        )
        expect(steps).toHaveTextContent('Design')
        expect(steps).toHaveTextContent('Sketch the routes.')
        expect(steps).toHaveTextContent('Build')
        expect(
            await screen.findByRole('heading', { name: 'Ship the API' })
        ).toBeInTheDocument()
    })

    it('renders partial steps as the object streams in', async () => {
        const stream = controllableJsonFetch()
        render(<PlanPanel fetch={stream.fetch} />)

        await askForAPlan()

        stream.emit('{"goal":"Ship the API","steps":[{"title":"Desi')
        expect(
            await screen.findByRole('heading', { name: 'Ship the API' })
        ).toBeInTheDocument()

        stream.emit('gn","detail":"Sketch the routes."}')
        const steps = await screen.findByRole('list', { name: /steps/i })
        await waitFor(() => expect(steps).toHaveTextContent('Design'))

        // Still streaming — the busy state is visible and can be stopped.
        expect(screen.getByRole('status')).toHaveTextContent(/planning/i)

        stream.emit(']}')
        stream.close()
        await waitFor(() =>
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        )
    })

    it('stops the stream when Stop is pressed', async () => {
        const stream = controllableJsonFetch()
        render(<PlanPanel fetch={stream.fetch} />)

        await askForAPlan()
        stream.emit('{"goal":"Ship the API","steps":[]}')

        await userEvent.click(
            await screen.findByRole('button', { name: /stop/i })
        )

        await waitFor(() =>
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        )
        // The partial object survives the stop.
        expect(
            screen.getByRole('heading', { name: 'Ship the API' })
        ).toBeInTheDocument()
    })

    it('surfaces a failed request as an alert', async () => {
        render(<PlanPanel fetch={failingFetch('network down')} />)

        await askForAPlan()

        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent(/could not build a plan/i)
        expect(alert).toHaveTextContent('network down')
    })

    it('does not submit an empty goal', async () => {
        const stream = controllableJsonFetch()
        render(<PlanPanel fetch={stream.fetch} />)

        await userEvent.click(screen.getByRole('button', { name: /plan/i }))

        expect(stream.callCount()).toBe(0)
    })
})
