export type ScrollPosition = {
    scrollTop: number
    scrollHeight: number
    clientHeight: number
}

/** How far from the floor still counts as "reading the newest message". */
export const STICK_THRESHOLD_PX = 120

/**
 * Whether the log should follow new content down.
 *
 * The rule exists so streaming never yanks the view away from someone who
 * scrolled up to re-read something: once they leave the floor, they own the
 * scroll position until they come back.
 */
export const shouldStickToBottom = (
    { scrollTop, scrollHeight, clientHeight }: ScrollPosition,
    threshold = STICK_THRESHOLD_PX
) => scrollHeight - (scrollTop + clientHeight) <= threshold
