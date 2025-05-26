import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Escuchar en todas las interfaces de red
    port: 10301,  // Puerto especificado
     open: true,
  },
  plugins: [react()],
})
