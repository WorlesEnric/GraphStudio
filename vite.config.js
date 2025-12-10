import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/panels/figma-x6-editor/frontend/src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173', 10),
    host: true
  }
})