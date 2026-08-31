/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#f4f7fb",
        brand: {
          50: "#eef8ff",
          100: "#d8efff",
          300: "#70c0ff",
          400: "#3ea0ef",
          500: "#1f7ae0",
          600: "#1864c7",
          700: "#134fa1",
        },
        accent: "#12b886",
        warning: "#f08c00",
        danger: "#e03131",
      },
      boxShadow: {
        soft: "0 20px 40px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
