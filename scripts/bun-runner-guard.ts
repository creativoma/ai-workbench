// Preloaded by `bun test` via bunfig.toml. Bun's own runner ignores
// vite.config.ts, so jsdom never loads and `vi` does not exist — every
// component test fails with `document is not defined` for reasons that have
// nothing to do with the code. One clear message beats a wall of 21 failures.
console.error(
    "\n  This project's tests run on Vitest, not Bun's test runner.\n\n" +
        '    bun run test     ← use this (adds the "run")\n' +
        '    bun test         ← what you just ran; no jsdom, no vi\n\n' +
        '  Also available: bun run e2e (Playwright), bun run eval (scored dataset).\n'
)

process.exit(1)
