import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
   base: '/',
  server:{
    open: true,
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('./src'),
      '@components': resolve('./src/components'),
      '@layouts' : resolve('./src/components/layouts'),
      '@assets': resolve('./src/assets'),
      '@pages': resolve('./src/pages'),
      '@utils': resolve('./src/utils'),
      '@hooks': resolve('./src/hooks'),
      '@services': resolve('./src/services'),
      '@types': resolve('./src/types'),
      '@styles': resolve('./src/styles'),
      '@images': resolve('./src/assets/images'),
      '@api': resolve('./src/api')
    }
  }
})
