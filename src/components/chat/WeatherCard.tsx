import type { ToolUIPart } from 'ai'
import { CloudSun } from 'lucide-react'
import { weatherOutputSchema } from '../../domain/tools/weather'
import { Card } from '../ui/Card'
import { ToolPending } from './ToolPending'

type WeatherCardProps = {
    part: ToolUIPart
}

export function WeatherCard({ part }: WeatherCardProps) {
    switch (part.state) {
        case 'output-available': {
            const parsed = weatherOutputSchema.safeParse(part.output)
            if (!parsed.success) {
                return <p role="alert">Weather data unavailable</p>
            }
            const { city, temperatureC, conditions } = parsed.data
            return (
                <Card
                    label={`Weather in ${city}`}
                    title={
                        <span className="flex items-center gap-2">
                            <CloudSun
                                size={16}
                                strokeWidth={1.5}
                                aria-hidden="true"
                                className="text-ink-400"
                            />
                            {city}
                        </span>
                    }
                >
                    <p className="flex items-baseline gap-2">
                        <span className="text-[28px] leading-8 font-semibold tracking-[-0.01em] text-ink-950">
                            {temperatureC}°C
                        </span>
                        <span className="text-[13px] leading-5 text-ink-500">
                            {conditions}
                        </span>
                    </p>
                </Card>
            )
        }
        case 'output-error':
            return (
                <p
                    role="alert"
                    className="text-[13px] leading-5 text-brand-700"
                >
                    {part.errorText}
                </p>
            )
        default:
            return <ToolPending>Checking the weather…</ToolPending>
    }
}
