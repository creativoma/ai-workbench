import type { UIMessage } from 'ai'
import { splitFencedCode } from '../../domain/chat/fenced-code'
import type { Rating } from '../../domain/observability/feedback'
import { traceIdOf } from '../../domain/observability/feedback'
import { Sparkle } from '../ui/Sparkle'
import { ApprovalCard, type ApprovalResponse } from './ApprovalCard'
import { CodeBlock } from './CodeBlock'
import { FeedbackControls } from './FeedbackControls'
import { WeatherCard } from './WeatherCard'

type MessageListProps = {
    messages: UIMessage[]
    onApprovalRespond: (response: ApprovalResponse) => void
    onFeedback?: (traceId: string, rating: Rating) => Promise<void>
    /** Drives the caret on the tail of the last assistant message (§6). */
    streaming?: boolean
}

export function MessageList({
    messages,
    onApprovalRespond,
    onFeedback,
    streaming = false,
}: MessageListProps) {
    const lastIndex = messages.length - 1

    return (
        <ol
            aria-label="Conversation"
            aria-live="polite"
            className="flex flex-col gap-8"
        >
            {messages.map((message, messageIndex) => {
                // Present only once the server has traced the turn, so there is
                // something to attach the score to.
                const traceId = traceIdOf(message.metadata)
                const isUser = message.role === 'user'
                const isLast = messageIndex === lastIndex

                return (
                    <li
                        key={message.id}
                        data-role={message.role}
                        className={[
                            'message-enter flex flex-col',
                            isUser ? 'items-end' : 'items-start',
                        ].join(' ')}
                    >
                        {isUser ? (
                            <UserBubble message={message} />
                        ) : (
                            <AssistantBlock
                                message={message}
                                streaming={streaming && isLast}
                                onApprovalRespond={onApprovalRespond}
                            />
                        )}

                        {!isUser && traceId && onFeedback ? (
                            <div className="mt-3">
                                <FeedbackControls
                                    onSubmit={(rating) =>
                                        onFeedback(traceId, rating)
                                    }
                                />
                            </div>
                        ) : null}
                    </li>
                )
            })}
        </ol>
    )
}

function UserBubble({ message }: { message: UIMessage }) {
    return (
        <div className="max-w-[min(520px,66%)] rounded-xl border border-line-200 bg-surface-0 px-5 py-[18px] shadow-xs">
            {message.parts.map((part, index) =>
                part.type === 'text' ? (
                    <p
                        key={index}
                        className="text-[15px] leading-6 whitespace-pre-wrap text-ink-900"
                    >
                        {part.text}
                    </p>
                ) : null
            )}
        </div>
    )
}

function AssistantBlock({
    message,
    streaming,
    onApprovalRespond,
}: {
    message: UIMessage
    streaming: boolean
    onApprovalRespond: (response: ApprovalResponse) => void
}) {
    const lastTextIndex = message.parts.reduce(
        (last, part, index) => (part.type === 'text' ? index : last),
        -1
    )

    return (
        <div className="w-full">
            <Sparkle size={20} />

            <div className="mt-4 flex flex-col gap-5">
                {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                        return (
                            <ProseWithCode
                                key={index}
                                text={part.text}
                                // Only the tail of the message gets the caret.
                                caret={streaming && index === lastTextIndex}
                            />
                        )
                    }
                    if (part.type === 'tool-getWeather') {
                        return <WeatherCard key={index} part={part} />
                    }
                    if (part.type === 'tool-sendEmail') {
                        return (
                            <ApprovalCard
                                key={index}
                                part={part}
                                onRespond={onApprovalRespond}
                            />
                        )
                    }
                    return null
                })}
            </div>
        </div>
    )
}

function ProseWithCode({ text, caret }: { text: string; caret: boolean }) {
    const segments = splitFencedCode(text)
    const lastIndex = segments.length - 1

    return (
        <>
            {segments.map((segment, index) =>
                segment.kind === 'code' ? (
                    <CodeBlock
                        key={index}
                        code={segment.code}
                        language={segment.language}
                        filename={segment.filename}
                    />
                ) : (
                    <p
                        key={index}
                        className={[
                            'max-w-[720px] text-[15px] leading-[26px] whitespace-pre-wrap text-ink-700',
                            caret && index === lastIndex ? 'caret' : '',
                        ].join(' ')}
                    >
                        {segment.text}
                    </p>
                )
            )}
        </>
    )
}
