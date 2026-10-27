import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Anything the browser requests under /api is forwarded to the API
      // by the dev server. The browser only ever talks to localhost:5173,
      // so the request is same-origin and CORS never applies.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
