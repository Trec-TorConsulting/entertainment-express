import type { Config } from "tailwindcss";
import preset from "./tailwind-preset.js";

const config: Config = {
  presets: [preset],
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./storybook/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
