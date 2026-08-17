import { expect, test, type Page } from '@playwright/test'

// The specs stub the API rather than calling a model: the point is to prove the
// real browser wiring works, and a stub makes that deterministic and free.
const UI_MESSAGE_STREAM_HEADERS = {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    'x-vercel-ai-ui-message-stream': 'v1',
}

const sse = (chunks: unknown[]) =>
    chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('')

const tracedTextReply = (traceId: string, text: string) =>
    sse([
        { type: 'start', messageMetadata: { traceId } },
        { type: 'start-step' },
        { type: 'text-start', id: 't1' },
        { type: 'text-delta', id: 't1', delta: text },
        { type: 'text-end', id: 't1' },
        { type: 'finish-step' },
        { type: 'finish' },
    ])

const weatherReply = () =>
    sse([
        { type: 'start' },
        { type: 'start-step' },
        {
            type: 'tool-input-available',
            toolCallId: 'call-1',
            toolName: 'getWeather',
            input: { city: 'Madrid' },
        },
        {
            type: 'tool-output-available',
            toolCallId: 'call-1',
            output: { city: 'Madrid', temperatureC: 21, conditions: 'sunny' },
        },
        { type: 'finish-step' },
        { type: 'start-step' },
        { type: 'text-start', id: 't1' },
        { type: 'text-delta', id: 't1', delta: 'It is 21°C in Madrid.' },
        { type: 'text-end', id: 't1' },
        { type: 'finish-step' },
        { type: 'finish' },
    ])

const stubChat = (page: Page, body: string) =>
    page.route('**/api/chat', (route) =>
        route.fulfill({ status: 200, headers: UI_MESSAGE_STREAM_HEADERS, body })
    )

const chat = (page: Page) => page.getByRole('region', { name: 'Chat' })

const ask = async (page: Page, text: string) => {
    await chat(page).getByLabel('Message').fill(text)
    await chat(page).getByRole('button', { name: 'Send' }).click()
}

test('a user sends a message and reads the streamed reply', async ({
    page,
}) => {
    await stubChat(page, tracedTextReply('trace-e2e', 'Hola desde el stream.'))
    await page.goto('/')

    await ask(page, 'Saluda')

    await expect(page.getByText('Saluda')).toBeVisible()
    await expect(page.getByText('Hola desde el stream.')).toBeVisible()
    // The composer clears so the next turn can be typed straight away.
    await expect(chat(page).getByLabel('Message')).toHaveValue('')
})

test('a tool result renders as its own card', async ({ page }) => {
    await stubChat(page, weatherReply())
    await page.goto('/')

    await ask(page, 'Weather in Madrid?')

    const card = page.getByRole('article', { name: /weather in madrid/i })
    await expect(card).toBeVisible()
    await expect(card).toContainText('21')
    await expect(card).toContainText('sunny')
})

test('rating a traced answer reaches the feedback API', async ({ page }) => {
    await stubChat(page, tracedTextReply('trace-e2e', 'Hola.'))

    const scored: unknown[] = []
    await page.route('**/api/feedback', async (route) => {
        scored.push(route.request().postDataJSON())
        await route.fulfill({ status: 204, body: '' })
    })

    await page.goto('/')
    await ask(page, 'Saluda')

    await page.getByRole('button', { name: 'Helpful', exact: true }).click()

    await expect(page.getByText(/thanks for the feedback/i)).toBeVisible()
    expect(scored).toEqual([{ traceId: 'trace-e2e', rating: 'up' }])
})

test('fenced code in an answer becomes a copyable code card', async ({
    page,
}) => {
    await stubChat(
        page,
        tracedTextReply(
            'trace-e2e',
            'Here it is:\n\n```ts:app.ts\nconst a = 1\n```\n\nThat is all.'
        )
    )
    await page.goto('/')

    await ask(page, 'Show me the code')

    // Prose either side of the fence stays prose.
    await expect(page.getByText('Here it is:')).toBeVisible()
    await expect(page.getByText('That is all.')).toBeVisible()

    await expect(page.getByText('app.ts')).toBeVisible()
    await expect(page.getByText('const a = 1')).toBeVisible()

    const view = page.getByRole('tablist', { name: /code view/i })
    await expect(view.getByRole('tab', { name: /source/i })).toHaveAttribute(
        'aria-selected',
        'true'
    )
})

test('a failing API surfaces an error with a retry', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
        route.fulfill({ status: 500, body: 'boom' })
    )
    await page.goto('/')

    await ask(page, 'Saluda')

    await expect(chat(page).getByRole('alert')).toContainText(
        /something went wrong/i
    )
    await expect(
        chat(page).getByRole('button', { name: 'Retry' })
    ).toBeVisible()
})
