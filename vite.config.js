import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Añadimos esta sección para asegurar que el entorno de construcción
  // sea compatible con las características modernas de JavaScript que usamos.
  build: {
    target: 'esnext'
  }
})
