import { tool } from 'ai'
import {
    weatherInputSchema,
    type WeatherReport,
} from '../../src/domain/tools/weather'

// Demo implementation: deterministic stub instead of a real weather API.
export const getWeather = tool({
    description: 'Get the current weather for a city',
    inputSchema: weatherInputSchema,
    execute: async ({ city }): Promise<WeatherReport> => ({
        city,
        temperatureC: 21,
        conditions: 'sunny',
    }),
})
