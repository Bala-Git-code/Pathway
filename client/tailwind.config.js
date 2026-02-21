/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    // Used dynamically in StepIndicator.jsx
    "animate-ping",
  ],
  theme: {
    extend: {
      colors: {
        "bio-bg": "#060d1a",
        "bio-surface": "#0b1629",
        "bio-cyan": "#22d3ee",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
