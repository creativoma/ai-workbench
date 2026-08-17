import { expect, test, type Page } from '@playwright/test'

const rail = (page: Page) => page.getByRole('navigation', { name: 'Sections' })
const sidebars = (page: Page) => page.getByRole('navigation', { name: 'Chats' })

test('desktop shows all three regions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    await expect(rail(page)).toBeVisible()
    await expect(sidebars(page).first()).toBeVisible()
    await expect(page.getByRole('region', { name: 'Chat' })).toBeVisible()
    // The drawer opener belongs to narrow layouts only.
    await expect(
        page.getByRole('button', { name: 'Open sidebar' })
    ).toBeHidden()
})

test('narrow viewports move the sidebar into a drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(rail(page)).toBeHidden()
    await expect(sidebars(page).first()).toBeHidden()

    await page.getByRole('button', { name: 'Open sidebar' }).click()
    await expect(sidebars(page).last()).toBeVisible()

    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(sidebars(page).last()).toBeHidden()
})

test('Escape closes the drawer for keyboard users', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open sidebar' }).click()
    await expect(sidebars(page).last()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sidebars(page).last()).toBeHidden()
})

test('the composer stays reachable without a page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const chat = page.getByRole('region', { name: 'Chat' })
    await expect(chat.getByLabel('Message')).toBeVisible()
    await expect(chat.getByRole('button', { name: 'Send' })).toBeVisible()

    // Only the canvas track scrolls; the document itself must not.
    const scrollable = await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 1
    )
    expect(scrollable).toBe(false)
})
