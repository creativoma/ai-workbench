/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': 'http://localhost:8787',
        },
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: [
                        'src/domain/**/*.test.ts',
                        'server/**/*.test.ts',
                        'evals/**/*.test.ts',
                    ],
                },
            },
            {
                extends: true,
                test: {
                    name: 'ui',
                    environment: 'jsdom',
                    include: ['src/components/**/*.test.tsx'],
                    setupFiles: ['./src/test/setup.ts'],
                },
            },
        ],
    },
})
