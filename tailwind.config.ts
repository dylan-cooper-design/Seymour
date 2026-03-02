import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "sans-serif"],
      },
      fontSize: {
        "caps-label": ["10px", { lineHeight: "1" }],
        "label": ["12px", { lineHeight: "1" }],
        "label-sm": ["14px", { lineHeight: "20px" }],
        "body-sm": ["14px", { lineHeight: "22px" }],
        "header": ["20px", { lineHeight: "30px", letterSpacing: "-0.45px" }],
      },
      maxWidth: {
        "chat-content": "720px",
        "message-list": "744px",
        "bubble": "85%",
      },
      minHeight: {
        "input-line": "22px",
      },
      colors: {
        seymour: {
          // Backgrounds
          bg:      "#141414", // base app background
          surface: "#1e1e1e", // hover / raised surface
          "surface-2": "#232426", // secondary raised surface
          canvas:  "#1c1d1f", // main content background

          // Borders
          border: "#302f2d", // default border + active item bg
          "border-subtle": "#3f3e3a", // interactive element border variant

          // Text
          text:   "#e3e2e1", // primary text
          white:  "#ffffff", // pure white (Figma --white)

          // Accent
          accent: "#d4b774", // active / gold

          // Error (semantic)
          "error-bg": "#450a0a",
          "error-border": "#b91c1c",
          "error-text": "#f87171",
        },
      },
      width: {
        sidebar: "240px",
      },
    },
  },
  plugins: [],
};

export default config;
