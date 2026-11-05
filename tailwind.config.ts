import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pearl: "#fbf7f0",
        ink: "#241c14",
        gold: "#8d6b32",
      },
      boxShadow: {
        card: "0 24px 60px rgba(80, 52, 18, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
