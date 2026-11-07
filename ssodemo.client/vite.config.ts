import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api calls are proxied to the ASP.NET Core API, so no CORS setup is needed
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:5163' },
  },
})
