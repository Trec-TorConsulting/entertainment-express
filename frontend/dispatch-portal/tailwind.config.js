import eePreset from "../portal-kit/tailwind-preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [eePreset],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "../portal-kit/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
