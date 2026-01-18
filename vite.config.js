import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    server: {
        host: true, // Listen on all addresses
        port: 5173,
        strictPort: true,
        cors: {
            origin: '*',
            credentials: true,
        },
        hmr: {
            protocol: 'ws',
            host: '192.168.1.10',
            port: 5173,
        },
    },
});