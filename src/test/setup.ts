import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean
}

// React only batches test updates into act() when it sees this flag, and
// without it every async state update logs a warning.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
    cleanup()
})
