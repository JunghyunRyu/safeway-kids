import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  // P3-72: SSG - generate static HTML for SEO-critical pages at build time
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
});
