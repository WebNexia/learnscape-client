import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { publicPageMetaPlugin } from './vite/publicPageMetaPlugin';
export default defineConfig({
    plugins: [publicPageMetaPlugin(), react()],
    resolve: {
        alias: {
            '@utils': path.resolve(__dirname, 'src/utils'),
        },
    },
});
