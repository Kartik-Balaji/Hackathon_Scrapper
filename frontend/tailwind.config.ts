import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "pixel-black": "#0B0B0B",
        "neon-yellow": "#FFD600",
        "hot-pink": "#FF2E88",
        "electric-blue": "#2EDBFF",
        "cream-white": "#F5F1E8",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"Share Tech Mono"', "monospace"],
      },
      boxShadow: {
        "pixel-yellow": "3px 3px 0px #FFD600",
        "pixel-pink": "3px 3px 0px #FF2E88",
        "pixel-blue": "3px 3px 0px #2EDBFF",
        "pixel-white": "3px 3px 0px #F5F1E8",
        "glow-yellow": "0 0 12px #FFD600, 0 0 24px #FFD60044",
        "glow-pink": "0 0 12px #FF2E88, 0 0 24px #FF2E8844",
        "glow-blue": "0 0 12px #2EDBFF, 0 0 24px #2EDBFF44",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pixelPulse: {
          "0%, 100%": { boxShadow: "0 0 0px #FFD600" },
          "50%": { boxShadow: "0 0 16px #FFD600, 0 0 32px #FFD60066" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        scanline: "scanline 4s linear infinite",
        float: "float 3s ease-in-out infinite",
        "pixel-pulse": "pixelPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
