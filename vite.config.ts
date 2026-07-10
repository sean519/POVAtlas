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
    },
  },
  server: {
    host: true, // listen on all addresses (fixes IPv4/IPv6 localhost issues)
    port: 5180,
    strictPort: true,
    open: true,
  },
});
