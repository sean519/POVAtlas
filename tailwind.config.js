/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Soft, playful educational theme: pastel blues, mint, warm accents.
        brand: {
          navy: "#3a4a73", // soft indigo ink (readable text + panel headers)
          blue: "#5b86e5", // periwinkle
          sky: "#6fc3e8", // soft sky
          green: "#5ec9a0", // mint
          pitch: "#34b187", // medium mint-green (white text readable)
          gold: "#ffc857", // warm soft yellow
          peach: "#ff9e80", // coral accent
          lilac: "#b8a6f0", // soft lilac
          cream: "#fff7ee",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(11, 31, 58, 0.25)",
      },
    },
  },
  plugins: [],
};
