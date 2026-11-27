/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// Default of src/config.ts, also needed by index.html (dserver-url).
process.env.VUE_APP_DTOOL_LOOKUP_SERVER_URL ||= "http://localhost:5000";

export default defineConfig({
  plugins: [vue()],
  // Configuration comes from VUE_APP_* environment variables (and .env
  // files), as with Vue CLI before; they are import.meta.env.VUE_APP_*.
  envPrefix: ["VUE_APP_", "VITE_"],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8080,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.spec.{js,ts}"],
    css: true,
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
  },
});
