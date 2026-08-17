import { useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Plus, SlidersHorizontal } from 'lucide-react'
import { Sparkle } from '../ui/Sparkle'

type ComposerProps = {
    disabled?: boolean
    onSend: (text: string) => void
}

const MAX_HEIGHT = 200

// DESIGN.md §6. Deviation, noted there: the reference's mic glyph implies a
// voice feature this app does not have, and the send control keeps the
// accessible name "Send" in every state so it stays a single, predictable
// target. Stop lives in Chat's status strip rather than replacing Send.
export function Composer({ disabled = false, onSend }: ComposerProps) {
    const [input, setInput] = useState('')
    const [focused, setFocused] = useState(false)
    const textarea = useRef<HTMLTextAreaElement>(null)

    const submit = () => {
        const text = input.trim()
        if (!text) return
        onSend(text)
        setInput('')
        if (textarea.current) textarea.current.style.height = 'auto'
    }

    // Auto-grow to MAX_HEIGHT, then let the textarea scroll.
    const resize = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto'
        element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`
    }

    return (
        <div>
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    submit()
                }}
                className="rounded-xl border border-line-200 bg-surface-0 px-4 pt-4 pb-3 shadow-lg"
            >
                <div className="flex items-start gap-3">
                    <span className="mt-1 shrink-0">
                        {focused ? (
                            <Sparkle size={18} />
                        ) : (
                            <Sparkle size={18} muted className="text-ink-400" />
                        )}
                    </span>
                    <textarea
                        ref={textarea}
                        aria-label="Message"
                        value={input}
                        rows={1}
                        placeholder="Do anything with AI Workbench…"
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChange={(event) => {
                            setInput(event.target.value)
                            resize(event.target)
                        }}
                        onKeyDown={(event) => {
                            // Enter sends; Shift+Enter is a newline.
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault()
                                if (!disabled) submit()
                            }
                        }}
                        className="min-h-14 w-full resize-none border-0 bg-transparent text-[15px] leading-6 text-ink-900 placeholder:text-ink-400 focus:outline-none"
                    />
                </div>

                <div className="mt-3 flex h-10 items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Attach a file"
                            className="grid size-9 place-items-center rounded-full border border-line-300 text-ink-700 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                        >
                            <Plus size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            type="button"
                            className="flex h-9 items-center gap-2 rounded-full border border-line-300 px-3.5 text-[14px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                        >
                            <SlidersHorizontal
                                size={16}
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                            Tools
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="hidden h-10 items-center gap-1.5 rounded-full border border-line-300 px-4 text-[14px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2 sm:flex"
                        >
                            Opus 5
                            <ChevronDown
                                size={16}
                                strokeWidth={1.5}
                                aria-hidden="true"
                                className="text-ink-400"
                            />
                        </button>
                        <button
                            type="submit"
                            aria-label="Send"
                            disabled={disabled}
                            className={[
                                'grid size-10 place-items-center rounded-full transition-colors duration-[120ms] ease-out',
                                disabled
                                    ? 'bg-surface-2 text-ink-300 shadow-none'
                                    : 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700',
                            ].join(' ')}
                        >
                            <ArrowUp size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </form>

            <p className="mt-4 text-center text-[13px] leading-5 text-ink-500">
                AI Workbench can make mistakes. Verify anything important.
            </p>
        </div>
    )
}
