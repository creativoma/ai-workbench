import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithApprovalResponses,
    lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai'
import type { ChatTransport, UIMessage } from 'ai'
import { RotateCcw, Square, TriangleAlert } from 'lucide-react'
import { canSend, isBusy } from '../../domain/chat/conversation'
import { shouldStickToBottom } from '../../domain/chat/scroll'
import type {
    FeedbackRequest,
    Rating,
} from '../../domain/observability/feedback'
import { Sparkle } from '../ui/Sparkle'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

type ChatProps = {
    transport?: ChatTransport<UIMessage>
    // Groups this conversation's traces together in Langfuse.
    sessionId?: string
    sendFeedback?: (request: FeedbackRequest) => Promise<void>
    /** Panels that share the canvas, placed between the log and the composer. */
    tools?: ReactNode
}

const postFeedback = async (request: FeedbackRequest) => {
    const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error(`feedback failed (${res.status})`)
}

export function Chat({ transport, sessionId, sendFeedback, tools }: ChatProps) {
    const chatTransport = useMemo(
        () => transport ?? new DefaultChatTransport({ api: '/api/chat' }),
        [transport]
    )
    const {
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
        error,
        addToolApprovalResponse,
    } = useChat({
        transport: chatTransport,
        // Resume the run both when client tools finish and when the human
        // answers a pending approval.
        sendAutomaticallyWhen: (options) =>
            lastAssistantMessageIsCompleteWithToolCalls(options) ||
            lastAssistantMessageIsCompleteWithApprovalResponses(options),
    })

    const submitFeedback = async (traceId: string, rating: Rating) =>
        (sendFeedback ?? postFeedback)({ traceId, rating })

    const busy = isBusy(status)

    // Follow new content down, but only for a reader who is already at the
    // floor — scrolling up to re-read something must not be yanked away.
    const track = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const stick = useRef(true)

    useEffect(() => {
        const element = track.current
        const grown = content.current
        if (!element || !grown) return

        const follow = () => {
            if (stick.current) element.scrollTop = element.scrollHeight
        }

        follow()

        // Watching the content box rather than the message array catches every
        // kind of growth — streamed deltas, a tool card resolving, a plan
        // panel filling in — instead of only the ones Chat knows about.
        if (typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(follow)
        observer.observe(grown)
        return () => observer.disconnect()
    }, [])

    return (
        <section
            aria-label="Chat"
            // DESIGN.md §6: the canvas owns the conversation; only its inner
            // track scrolls, so the composer can float over its bottom edge.
            className="canvas relative mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-surface-2 md:mx-5 md:mb-5 md:rounded-2xl xl:mx-6 xl:mb-6"
        >
            <div
                ref={track}
                onScroll={(event) => {
                    stick.current = shouldStickToBottom(event.currentTarget)
                }}
                // Bottom padding clears the floating composer, so the last
                // message can always be scrolled out from behind it (§6).
                className="min-h-0 flex-1 overflow-y-auto px-3 pt-10 pb-[240px] md:px-8"
            >
                <div
                    ref={content}
                    className="mx-auto flex w-full max-w-[780px] flex-col gap-8"
                >
                    {messages.length === 0 ? <EmptyState /> : null}

                    <MessageList
                        messages={messages}
                        onApprovalRespond={(response) =>
                            void addToolApprovalResponse(response)
                        }
                        onFeedback={submitFeedback}
                        streaming={busy}
                    />

                    {busy ? (
                        <div className="flex items-center gap-3">
                            <span
                                role="status"
                                className="text-[13px] leading-5 text-ink-500"
                            >
                                Thinking…
                            </span>
                            <button
                                type="button"
                                onClick={() => void stop()}
                                className="flex h-8 items-center gap-1.5 rounded-md border border-line-300 bg-surface-0 px-2.5 text-[13px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                            >
                                <Square
                                    size={12}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                    className="fill-current"
                                />
                                Stop
                            </button>
                        </div>
                    ) : null}

                    {status === 'error' ? (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-lg border border-line-200 bg-surface-0 px-4 py-3"
                        >
                            <TriangleAlert
                                size={16}
                                strokeWidth={1.5}
                                aria-hidden="true"
                                className="mt-0.5 shrink-0 text-brand-500"
                            />
                            <p className="min-w-0 flex-1 text-[13px] leading-5 text-ink-700">
                                Something went wrong
                                {error ? `: ${error.message}` : ''}
                            </p>
                            <button
                                type="button"
                                onClick={() => void regenerate()}
                                className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line-300 px-2.5 text-[13px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                            >
                                <RotateCcw
                                    size={14}
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                />
                                Retry
                            </button>
                        </div>
                    ) : null}

                    {tools}
                </div>
            </div>

            {/* The composer floats over the canvas floor rather than sitting in
                the scroll flow, so the fade behind it covers dead space instead
                of eating the last message. pointer-events pass through the
                padding so the fade never swallows a scroll gesture. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3 md:px-8 md:pb-6">
                <div className="pointer-events-auto mx-auto w-full max-w-[780px]">
                    <Composer
                        disabled={!canSend(status)}
                        onSend={(text) =>
                            void sendMessage({ text }, { body: { sessionId } })
                        }
                    />
                </div>
            </div>
        </section>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-start gap-4 pt-4">
            <Sparkle size={28} />
            <h2 className="text-[18px] leading-7 font-semibold tracking-[-0.01em] text-ink-950">
                What are we building today?
            </h2>
            <p className="max-w-[560px] text-[15px] leading-[26px] text-ink-700">
                Ask for the weather to see a tool card, draft an email to hit
                the approval gate, or describe a goal below to stream a
                structured plan.
            </p>
        </div>
    )
}
