import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        teal: {
          50: "#EEF3FB",
          100: "#CCE0F5",
          200: "#99C4ED",
          500: "#0A66C2",
          600: "#0A66C2",
          700: "#004182",
          800: "#003569",
          900: "#001E3C"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
