/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import million from "million/compiler";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    minify: "esbuild",
  },
  server: {
    port: 3004,
  },
  plugins: [
    million.vite({ auto: true }),
    react(),
    checker({
      typescript: true,
    }),
  ],
});
