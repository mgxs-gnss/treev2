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
    minify: "esbuild"
  },
  server: {
    port: 3004
  },
  plugins: _plugins
});