import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Change this to your GitHub repo name
  // e.g. if your repo is https://github.com/yourname/survey-dashboard
  // set base: '/survey-dashboard/'
  base: '/',
})
