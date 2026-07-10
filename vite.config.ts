import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two pages: the main atlas app and the /game mini-game subpage.
      input: {
        main: "index.html",
        game: "game.html",
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
