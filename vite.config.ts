import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Ensure compatibility with ICP
    target: 'es2020',
    sourcemap: false,
  },
  server: {
    port: 3000,
    host: true,
  },
  // Define environment variables for different networks
  define: {
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK || 'local'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Optimize for production builds
  optimizeDeps: {
    include: ['@dfinity/agent', '@dfinity/principal'],
  },
})
