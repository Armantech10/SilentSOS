/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#dbe5ff',
          200: '#adc1ff',
          300: '#92acfe',
          400: '#5c80fe',
          500: '#1a56db', // SilentSOS Accent Blue
          600: '#1544af',
          700: '#0f3281',
          800: '#0a2153',
          900: '#05102a',
        },
        neutral: {
          50: '#f9fafb', // Soft background
          100: '#f3f4f6', // Light gray background
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
    },
  },
  plugins: [],
}
