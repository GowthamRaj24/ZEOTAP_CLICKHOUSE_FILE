import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable the new JSX transform
      jsxRuntime: 'automatic'
    })
  ],
  // Ensure environment variables are loaded correctly
  define: {
    'process.env': {}
  }
}) 