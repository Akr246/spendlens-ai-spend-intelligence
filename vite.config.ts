import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is the repo name so the build works on GitHub Pages
// (https://<user>.github.io/spendlens-ai-spend-intelligence/).
// Override with BASE_PATH=/ for a custom domain or a root deploy.
const base = process.env.BASE_PATH ?? '/spendlens-ai-spend-intelligence/'

export default defineConfig({
  base,
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
})
