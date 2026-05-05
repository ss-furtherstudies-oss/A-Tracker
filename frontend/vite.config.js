import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use a relative base so the app works correctly when deployed on
  // GitHub Pages under a repository path (e.g. /A-Tracker/).
  base: "./",
  plugins: [react()],
  optimizeDeps: {
    include: ['prop-types', 'react-simple-maps']
  }
})
