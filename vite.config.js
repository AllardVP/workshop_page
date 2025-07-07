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
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js'],
          'vendor': ['@supabase/supabase-js']
        },
        // Optimize asset filenames
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `img/[name]-[hash][extname]`
          }
          if (/\.css$/.test(assetInfo.name)) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable compression analysis
    reportCompressedSize: true
  },
  
  // Public directory
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true
  },
  
  // Preview server configuration
  preview: {
    port: 3001,
    host: true,
    cors: true
  },
  
  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  
  // Environment variables
  define: {
    'process.env': {}
  },
  
  // Enable experimental features for better performance
  esbuild: {
    target: 'es2020',
    format: 'esm',
    platform: 'browser'
  }
}) 