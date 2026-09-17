import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9f1",
          100: "#dcf0de",
          200: "#bbdfc1",
          300: "#8dc698",
          400: "#5ba569",
          500: "#3a8848",
          600: "#2b6d37",
          700: "#23572e",
          800: "#1f4627",
          900: "#1b3b22",
        },
      },
    },
  },
  plugins: [],
};

export default config;