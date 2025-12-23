import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Explicitly declare process to prevent TypeScript 'Cannot find name' errors
declare const process: {
  cwd: () => string;
  env: Record<string, string>;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // Removed process.env.API_KEY definition to prevent leaking credentials to the client bundle.
    // The API key is now handled securely server-side via Netlify Functions.
  }
})