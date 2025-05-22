import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Changed from 3000 since that port was in use
    strictPort: false, // Allow fallback to another port if needed
    open: true, // Auto-opens browser when server starts
  },
  resolve: {
    alias: {
      "@": "/src", // Allows importing from 'src' using '@'
    },
  },
});
