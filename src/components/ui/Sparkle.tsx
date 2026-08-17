type SparkleProps = {
    /** Rendered size in px; the glyph is drawn on a 20×20 grid. */
    size?: number
    /** Muted variant for resting states (composer, inactive rail). */
    muted?: boolean
    className?: string
}

// DESIGN.md §6: 4-point star carrying the brand gradient. Rendered as SVG
// rather than a CSS mask so it scales and inherits nothing unexpected.
export function Sparkle({ size = 20, muted = false, className }: SparkleProps) {
    const gradientId = muted ? undefined : 'sparkle-gradient'

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            {gradientId ? (
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="20"
                        y2="20"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor="#F0511E" />
                        <stop offset="45%" stopColor="#E5399B" />
                        <stop offset="100%" stopColor="#4C6FFF" />
                    </linearGradient>
                </defs>
            ) : null}
            <path
                d="M10 0.6 C10.9 5.3 12.7 7.1 17.4 8 C12.7 8.9 10.9 10.7 10 15.4 C9.1 10.7 7.3 8.9 2.6 8 C7.3 7.1 9.1 5.3 10 0.6 Z"
                transform="translate(0 2)"
                fill={gradientId ? `url(#${gradientId})` : 'currentColor'}
            />
        </svg>
    )
}
