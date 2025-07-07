import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL for deployment
  base: './',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  },
  
  // Public directory
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // Environment variables
  define: {
    'process.env': {}
  },
  
  // CSS configuration
  css: {
    postcss: './postcss.config.js'
  }
}) 