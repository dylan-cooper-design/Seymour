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
        seymour: {
          sidebar: "rgb(24 24 27)", // zinc-900
          panel: "rgb(18 18 20)", // zinc-950
          surface: "rgb(39 39 42)", // zinc-800
          border: "rgb(63 63 70)", // zinc-700
          "user-bubble": "rgb(99 102 241)", // indigo-500
          "assistant-bubble": "rgb(39 39 42)", // zinc-800
        },
      },
      width: {
        sidebar: "280px",
      },
    },
  },
  plugins: [],
};

export default config;
