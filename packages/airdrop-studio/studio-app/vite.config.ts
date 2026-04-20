import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import {nodePolyfills} from 'vite-plugin-node-polyfills'
import inject from "@rollup/plugin-inject";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills(),],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      buffer: "buffer"
    }
  },
  define: {
    global: "globalThis"
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_STUDIO_API_ORIGIN ?? "http://127.0.0.1:4174",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/studio-app"),
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ["buffer", "Buffer"]
        })
      ]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    }
  }
});
