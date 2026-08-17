import { useState } from 'react'
import { AppShell } from './components/shell/AppShell'
import { Chat } from './components/chat/Chat'
import { PlanPanel } from './components/plan/PlanPanel'

export function App() {
    // One id per page load, so a conversation's turns group into one Langfuse
    // session instead of arriving as unrelated traces.
    const [sessionId] = useState(() => crypto.randomUUID())

    return (
        <AppShell title="Streaming chat states">
            {/* The plan panel shares the canvas, so the composer stays pinned
                to its floor rather than being pushed below a second panel. */}
            <Chat sessionId={sessionId} tools={<PlanPanel />} />
        </AppShell>
    )
}
