import portalPreset from "../portal-kit/tailwind-preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [portalPreset],
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../portal-kit/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
