import { useEffect, useState } from 'react'
import { Check, ChevronDown, CodeXml, Copy, WrapText } from 'lucide-react'

type CodeBlockProps = {
    code: string
    language?: string
    filename?: string
}

// DESIGN.md §6 code card. Two noted substitutions: the reference's code/eye
// toggle previews rendered output, which this app cannot do, so the segmented
// control switches soft-wrap instead — same anatomy, real behaviour; and the
// format menu is a disabled affordance until there is a second copy format.
export function CodeBlock({ code, language, filename }: CodeBlockProps) {
    const [wrapped, setWrapped] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 1600)
        return () => clearTimeout(timer)
    }, [copied])

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
        } catch {
            // Clipboard is permission-gated; failing silently is better than
            // throwing inside a render tree over a convenience action.
        }
    }

    const title = filename ?? language ?? 'Code'

    return (
        <div className="overflow-hidden rounded-lg border border-line-200 bg-surface-0">
            <header className="flex h-[52px] items-center justify-between gap-3 px-4">
                <span className="min-w-0 truncate font-mono text-[13px] leading-5 font-medium text-ink-900">
                    {title}
                </span>

                <div className="flex shrink-0 items-center gap-2.5">
                    <div
                        role="tablist"
                        aria-label="Code view"
                        className="flex items-center gap-0 rounded-md bg-surface-2 p-[3px]"
                    >
                        <ViewTab
                            label="Source"
                            selected={!wrapped}
                            onSelect={() => setWrapped(false)}
                        >
                            <CodeXml size={16} strokeWidth={1.5} />
                        </ViewTab>
                        <ViewTab
                            label="Wrap lines"
                            selected={wrapped}
                            onSelect={() => setWrapped(true)}
                        >
                            <WrapText size={16} strokeWidth={1.5} />
                        </ViewTab>
                    </div>

                    <div className="flex h-[34px] items-stretch overflow-hidden rounded-md border border-line-300">
                        <button
                            type="button"
                            onClick={() => void copy()}
                            className="flex items-center gap-1.5 px-2.5 text-[13px] leading-5 font-medium transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                        >
                            {copied ? (
                                <>
                                    <Check
                                        size={16}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                        className="text-code-attr"
                                    />
                                    <span className="text-code-attr">
                                        Copied
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Copy
                                        size={16}
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                        <span aria-hidden="true" className="w-px bg-line-200" />
                        <span
                            aria-hidden="true"
                            className="grid w-[26px] place-items-center text-ink-400"
                        >
                            <ChevronDown size={16} strokeWidth={1.5} />
                        </span>
                    </div>
                </div>
            </header>

            <pre
                className={[
                    'max-h-[420px] overflow-auto border-t border-line-100 px-5 py-4',
                    'font-mono text-[13px] leading-[22px] text-code-plain [tab-size:4]',
                    wrapped
                        ? 'whitespace-pre-wrap break-words'
                        : 'whitespace-pre',
                ].join(' ')}
            >
                <code>{code}</code>
            </pre>
        </div>
    )
}

function ViewTab({
    label,
    selected,
    onSelect,
    children,
}: {
    label: string
    selected: boolean
    onSelect: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={label}
            onClick={onSelect}
            className={[
                'grid size-8 place-items-center rounded-md transition-colors duration-[120ms] ease-out',
                selected
                    ? 'bg-tint-peach text-brand-500 shadow-xs'
                    : 'bg-transparent text-ink-400 hover:text-ink-700',
            ].join(' ')}
        >
            {children}
        </button>
    )
}
