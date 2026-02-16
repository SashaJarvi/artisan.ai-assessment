import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'cytoscape': ['cytoscape', 'cytoscape-cola', 'cytoscape-dagre'],
          'codemirror': ['codemirror', '@codemirror/lang-go', '@codemirror/state', '@codemirror/view', '@codemirror/theme-one-dark'],
          'charts': ['chart.js', 'vue-chartjs']
        }
      }
    }
  }
})
