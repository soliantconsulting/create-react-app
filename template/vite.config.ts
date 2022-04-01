import react from '@vitejs/plugin-react';
import {visualizer} from 'rollup-plugin-visualizer';
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        visualizer(),
    ],/* block:start:bootstrap */
    css: {
        modules: {
            localsConvention: 'camelCase',
        },
    },/* block:end:bootstrap */
    build: {
        sourcemap: true,
    },
});
