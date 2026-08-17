import { expect, test, type Page } from '@playwright/test'

// streamObject answers with a plain JSON text stream, so the stub is just the
// object split across chunks.
const stubPlan = (page: Page, chunks: string[]) =>
    page.route('**/api/plan', (route) =>
        route.fulfill({
            status: 200,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
            body: chunks.join(''),
        })
    )

const plan = (page: Page) => page.getByRole('region', { name: 'Plan' })

test('a structured plan streams in as a list of steps', async ({ page }) => {
    await stubPlan(page, [
        '{"goal":"Ship the API","steps":[',
        '{"title":"Design","detail":"Sketch the routes."},',
        '{"title":"Build","detail":"Implement the handlers."}]}',
    ])
    await page.goto('/')

    await plan(page).getByLabel('Goal').fill('Ship the API')
    await plan(page).getByRole('button', { name: 'Plan' }).click()

    await expect(
        page.getByRole('heading', { name: 'Ship the API' })
    ).toBeVisible()

    const steps = page.getByRole('list', { name: 'Steps' })
    await expect(steps.getByRole('listitem')).toHaveCount(2)
    await expect(steps).toContainText('Sketch the routes.')
    await expect(steps).toContainText('Implement the handlers.')
})
