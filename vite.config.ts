import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const LIBRARY_NAME = 'wtgui'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), cssInjectedByJsPlugin(),
    dts({ insertTypesEntry: true, rollupTypes: true }),
  ],
  build: {
    cssCodeSplit: true,
    target: 'esnext',
    outDir: './dist',
    minify: true,
    lib: {
      entry: './src/components/index.ts',
      name: LIBRARY_NAME,
      fileName: LIBRARY_NAME
    },
    rollupOptions: {
      external: [ 'vue' ],
      output: { 
        exports: 'named',
        globals: { vue: 'Vue' }
      }
    }
  }
})
