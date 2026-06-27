import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Naya compiler plugin


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
})