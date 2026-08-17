import type { ToolUIPart } from 'ai'
import { Check, ShieldAlert, X } from 'lucide-react'
import { emailInputSchema } from '../../domain/tools/email'
import { Card } from '../ui/Card'
import { ToolPending } from './ToolPending'

export type ApprovalResponse = {
    id: string
    approved: boolean
}

type ApprovalCardProps = {
    part: ToolUIPart
    onRespond: (response: ApprovalResponse) => void
}

export function ApprovalCard({ part, onRespond }: ApprovalCardProps) {
    if (part.state === 'approval-requested') {
        const draft = emailInputSchema.safeParse(part.input)

        return (
            <Card
                accent
                label="Approval required"
                title={
                    <span className="flex items-center gap-2">
                        <ShieldAlert
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="text-brand-500"
                        />
                        Approval required
                    </span>
                }
            >
                {draft.success ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px] leading-5">
                        <Field label="To">{draft.data.to}</Field>
                        <Field label="Subject">{draft.data.subject}</Field>
                        <Field label="Body">{draft.data.body}</Field>
                    </dl>
                ) : (
                    <p className="text-[13px] leading-5 text-ink-500">
                        Unrecognized draft
                    </p>
                )}

                <div className="mt-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onRespond({ id: part.approval.id, approved: true })
                        }
                        className="flex h-9 items-center gap-1.5 rounded-md bg-brand-500 px-3.5 text-[14px] leading-5 font-medium text-white transition-colors duration-[120ms] ease-out hover:bg-brand-600 active:bg-brand-700"
                    >
                        <Check size={16} strokeWidth={2} aria-hidden="true" />
                        Approve
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            onRespond({ id: part.approval.id, approved: false })
                        }
                        className="flex h-9 items-center gap-1.5 rounded-md border border-line-300 px-3.5 text-[14px] leading-5 font-medium text-ink-900 transition-colors duration-[120ms] ease-out hover:bg-surface-2"
                    >
                        <X size={16} strokeWidth={2} aria-hidden="true" />
                        Reject
                    </button>
                </div>
            </Card>
        )
    }

    if (part.state === 'output-denied') {
        return <Outcome>Email not sent — request rejected.</Outcome>
    }
    if (part.state === 'output-available') {
        return <Outcome>Email sent.</Outcome>
    }
    if (part.state === 'output-error') {
        return (
            <p role="alert" className="text-[13px] leading-5 text-brand-700">
                {part.errorText}
            </p>
        )
    }
    return <ToolPending>Preparing email…</ToolPending>
}

function Field({ label, children }: { label: string; children: string }) {
    return (
        <>
            <dt className="text-ink-500">{label}</dt>
            <dd className="min-w-0 break-words text-ink-900">{children}</dd>
        </>
    )
}

function Outcome({ children }: { children: string }) {
    return <p className="text-[13px] leading-5 text-ink-500">{children}</p>
}
