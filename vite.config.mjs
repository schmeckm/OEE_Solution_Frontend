import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
        include: ['quill']
    },
    plugins: [
        vue(),
        Components({
            resolvers: [
                PrimeVueResolver({
                    importStyle: 'scss' // Optional: PrimeVue SCSS-Styles aktivieren
                })
            ]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    esbuild: {
        target: 'esnext' // Unterstützt moderne Syntax wie Optional Chaining
    },
    build: {
        target: 'es2015' // Unterstützung für ältere Syntax
    }
});
