/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens lifted straight from the design system (tab 11 of the
        // product workbook). Meaning is never carried by colour alone — every
        // band also ships an icon and a text label.
        brand:  { DEFAULT: '#3730A3', 600: '#4338CA', 50: '#EEF2FF' },
        red:    { band: '#B42318', surface: '#FEF3F2', border: '#FDA29B', deep: '#912018' },
        green:  { band: '#027A48', surface: '#ECFDF3', border: '#6CE9A6', deep: '#05603A' },
        amber:  { band: '#B54708', surface: '#FFFAEB', border: '#FEC84B', deep: '#93370D' },
        grow:   { band: '#6941C6', surface: '#F4F3FF', border: '#B692F6', deep: '#53389E' },
        ink:    { 900: '#101828', 700: '#344054', 600: '#475467', 400: '#98A2B3', 300: '#D0D5DD', 100: '#F2F4F7', 50: '#F9FAFB', 25: '#FCFCFD' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'sans-serif'],
        num:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: { card: '0 1px 3px rgba(16,24,40,0.10)', lift: '0 4px 16px rgba(16,24,40,0.10)' },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
}
