import MillionLint from '@million/lint';
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import million from "million/compiler";
const _plugins = [million.vite({
  auto: true
}), react(), checker({
  typescript: true
})];
_plugins.unshift(MillionLint.vite())
export default defineConfig({
  build: {
    outDir: "dist",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-zoom': ['react-zoom-pan-pinch'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    port: 3004
  },
  plugins: _plugins
});