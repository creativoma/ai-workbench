import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import type { Rating } from '../../domain/observability/feedback'

type FeedbackControlsProps = {
    onSubmit: (rating: Rating) => Promise<void>
}

export function FeedbackControls({ onSubmit }: FeedbackControlsProps) {
    const [chosen, setChosen] = useState<Rating | null>(null)
    const [failed, setFailed] = useState(false)

    const submit = async (rating: Rating) => {
        setFailed(false)
        try {
            await onSubmit(rating)
            setChosen(rating)
        } catch {
            // A lost score shouldn't cost the user their answer — say so and
            // leave both buttons live for another try.
            setFailed(true)
        }
    }

    return (
        <div
            role="group"
            aria-label="Rate this answer"
            className="flex items-center gap-1"
        >
            <Thumb
                label="Helpful"
                chosen={chosen === 'up'}
                disabled={chosen !== null}
                onClick={() => void submit('up')}
            >
                <ThumbsUp size={16} strokeWidth={1.5} />
            </Thumb>
            <Thumb
                label="Not helpful"
                chosen={chosen === 'down'}
                disabled={chosen !== null}
                onClick={() => void submit('down')}
            >
                <ThumbsDown size={16} strokeWidth={1.5} />
            </Thumb>
            {chosen ? (
                <span
                    role="status"
                    className="ml-1.5 text-[13px] leading-5 text-ink-500"
                >
                    Thanks for the feedback
                </span>
            ) : null}
            {failed ? (
                <span
                    role="alert"
                    className="ml-1.5 text-[13px] leading-5 text-brand-700"
                >
                    Could not send feedback
                </span>
            ) : null}
        </div>
    )
}

function Thumb({
    label,
    chosen,
    disabled,
    onClick,
    children,
}: {
    label: string
    chosen: boolean
    disabled: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={chosen}
            disabled={disabled}
            onClick={onClick}
            className={[
                'grid size-9 place-items-center rounded-md transition-colors duration-[120ms] ease-out',
                chosen
                    ? 'bg-tint-peach text-brand-500'
                    : 'text-ink-400 enabled:hover:bg-surface-2 enabled:hover:text-ink-700',
                disabled && !chosen ? 'text-ink-300' : '',
            ].join(' ')}
        >
            {children}
        </button>
    )
}
