/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Bharat Sentinel Life — primary blue family
        navy: {
          50: '#EAF2FB',
          100: '#D2E4F6',
          200: '#A6C8ED',
          300: '#79ABE1',
          400: '#4D8CD0',
          500: '#2E6FBB',
          600: '#1C5698',
          700: '#154479',
          800: '#0F335C',
          900: '#0A2444',
          950: '#061630',
        },
        // Sky-blue accent used for highlights, active states and positive badges
        reef: {
          50: '#E6F3FF',
          100: '#C6E4FF',
          200: '#93CBFF',
          300: '#5EAEFB',
          400: '#3390EF',
          500: '#1476E0',
          600: '#0B5DBC',
          700: '#0C4B96',
          800: '#0E3F79',
          900: '#0D3562',
        },
        paper: '#EFF5FC',
        line: '#DCE7F3',
        pos: '#0F7B54',
        neg: '#C0392B',
        warn: '#B45309',
      },
      boxShadow: {
        card: '0 1px 2px rgba(12, 26, 46, 0.06), 0 1px 3px rgba(12, 26, 46, 0.04)',
        pop: '0 12px 32px rgba(12, 26, 46, 0.16)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.32,0.72,0,1)',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}
