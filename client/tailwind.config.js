/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0c1018",
        panel: "#121826",
        accent: "#f5c451",
        success: "#6ee7b7",
        danger: "#fb7185"
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(245,196,81,0.2), 0 16px 48px rgba(245,196,81,0.12)"
      },
      backgroundImage: {
        noise:
          "radial-gradient(circle at 15% 15%, rgba(245,196,81,0.18), transparent 35%), radial-gradient(circle at 85% 10%, rgba(56,189,248,0.15), transparent 28%), radial-gradient(circle at 50% 100%, rgba(248,113,113,0.12), transparent 30%)"
      }
    }
  },
  plugins: []
};
