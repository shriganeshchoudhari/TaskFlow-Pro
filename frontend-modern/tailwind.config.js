/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./.gemini/skills/**/*.tsx"
  ],
  theme: {
    extend: {
      colors: {
        "outline": "#717783",
        "on-secondary": "#ffffff",
        "inverse-primary": "#a5c8ff",
        "background": "#f8f9fb",
        "inverse-on-surface": "#eff1f3",
        "tertiary": "#ba5b00", // Fallback for the design
        "error": "#ba1a1a",
        "outline-variant": "#c1c6d4",
        "surface-variant": "#e0e3e5",
        "on-tertiary": "#ffffff",
        "secondary-container": "#bad3fd",
        "surface-tint": "#005dac", // Primary
        "surface-container-high": "#e6e8ea",
        "primary": "#005dac",
        "secondary": "#475f84",
        "on-surface-variant": "#414752",
        "surface-container": "#eceef0",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "surface-container-highest": "#e0e3e5",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        "on-error-container": "#93000a",
        "inverse-surface": "#2d3133",
        "on-primary": "#ffffff",
        "surface-bright": "#f8f9fb",
        "surface": "#f8f9fb",
        "primary-container": "#1976d2",
        "surface-dim": "#d8dadc",
        "on-background": "#191c1e",
        "on-surface": "#191c1e",
        "on-secondary-container": "#425b7f",
        
        // Task statuses
        "status-todo": "#757575",
        "status-in_progress": "#1565C0",
        "status-review": "#F57F17",
        "status-done": "#2E7D32",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px"
      },
      boxShadow: {
        // Ambient (Stitch spec: on-surface at 6% opacity, large blur)
        'ambient': '0 12px 32px -4px rgba(25, 28, 30, 0.06)',
        'ambient-md': '0 8px 20px -4px rgba(25, 28, 30, 0.08)',
      },
    },
  },
  plugins: [],
}
