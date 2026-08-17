import { defineConfig, devices } from '@playwright/test'

// A separate port from `bun run dev` so an open dev server doesn't collide with
// a test run. 127.0.0.1 rather than `localhost` on purpose: Vite binds IPv6
// `[::1]` by default, and a `localhost` health check that resolves to IPv4
// first never connects, so the run hangs waiting for a server that is up.
const port = 5174
const host = '127.0.0.1'
const baseURL = `http://${host}:${port}`

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // Only the Vite server: the specs stub /api/* themselves, so the suite
    // needs no API server, no ANTHROPIC_API_KEY and no model spend.
    webServer: {
        command: `bunx vite --host ${host} --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
