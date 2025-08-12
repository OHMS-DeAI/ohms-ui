import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@dfinity/agent': path.resolve(__dirname, 'src/shims/dfinity-agent.ts'),
      '@dfinity-agent-real': path.resolve(__dirname, 'node_modules/@dfinity/agent/lib/esm/index.js'),
      '@dfinity/identity/lib/cjs/identity/partial': path.resolve(__dirname, 'node_modules/@dfinity/identity/lib/cjs/identity/partial.js'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Workaround: force-resolve @dfinity/identity subpath exports
      external: [],
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
    include: [
      '@dfinity/agent',
      '@dfinity/principal',
      '@dfinity/candid',
      '@dfinity/auth-client',
      '@dfinity/identity',
      '@dfinity/ledger-icp',
      '@nfid/identitykit',
      '@nfid/identitykit/react',
      '@slide-computer/signer',
      '@slide-computer/signer-agent',
    ],
  },
})
