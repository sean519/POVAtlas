import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Three pages: the atlas app + the /game and /soccer mini-game subpages.
      input: {
        main: "index.html",
        game: "game.html",
        soccer: "soccer.html",
      },
      output: {
        // Libraries change far less often than app code: keep them in their
        // own chunks so a deploy doesn't invalidate them in visitors' caches.
        manualChunks(id) {
          if (!/node_modules/.test(id)) return undefined;
          if (/[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/.test(id)) return "vendor-map";
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "vendor-react";
          return undefined;
        },
      },
    },
  },
  server: {
    host: true, // listen on all addresses (fixes IPv4/IPv6 localhost issues)
    port: 5180,
    strictPort: true,
    open: true,
  },
});
