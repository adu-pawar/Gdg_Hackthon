/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#0EA5E9",
        accent: "#8B5CF6",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        "bg-dark": "#0F172A",
        "surface-dark": "#1E293B",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
