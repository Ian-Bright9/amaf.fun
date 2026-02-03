import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tsconfigPaths(),
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  ssr: {
    noExternal: ["@tanstack/react-start"],
  },
  server: {
    port: 3001,
  },
});
