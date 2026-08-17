export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export const canSend = (status: ChatStatus) =>
    status === 'ready' || status === 'error'

export const isBusy = (status: ChatStatus) =>
    status === 'submitted' || status === 'streaming'
