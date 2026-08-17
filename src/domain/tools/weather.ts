import { z } from 'zod'

export const weatherInputSchema = z.object({
    city: z.string().min(1, 'city is required'),
})

export const weatherOutputSchema = z.object({
    city: z.string(),
    temperatureC: z.number(),
    conditions: z.string(),
})

export type WeatherQuery = z.infer<typeof weatherInputSchema>
export type WeatherReport = z.infer<typeof weatherOutputSchema>
