import { fileURLToPath } from "node:url";

export default {
  plugins: {
    // Explicit path: Tailwind otherwise looks for its config in the process
    // cwd, which breaks builds started from another directory.
    tailwindcss: { config: fileURLToPath(new URL("./tailwind.config.js", import.meta.url)) },
    autoprefixer: {},
  },
};
