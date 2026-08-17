import { expect, test } from '@playwright/test'

test('the document head carries the indexable basics', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(
        'AI Workbench — streaming chat, tool calling and evals'
    )

    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /AI engineering lab/)
    // Google truncates past ~160 characters.
    const text = (await description.getAttribute('content')) ?? ''
    expect(text.length).toBeLessThanOrEqual(160)

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'index, follow'
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
})

test('every declared icon actually resolves', async ({ page, request }) => {
    await page.goto('/')

    const hrefs = await page
        .locator('link[rel~="icon"], link[rel="apple-touch-icon"]')
        .evaluateAll((links) =>
            links.map((link) => link.getAttribute('href') ?? '')
        )

    expect(hrefs.length).toBeGreaterThanOrEqual(3)

    for (const href of hrefs) {
        const res = await request.get(href)
        // The whole point: a referenced icon that 404s is a broken favicon.
        expect(res.status(), `${href} should be served`).toBe(200)
    }
})

test('robots.txt is served and keeps the API out of the index', async ({
    request,
}) => {
    const res = await request.get('/robots.txt')

    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Disallow: /api/')
})
