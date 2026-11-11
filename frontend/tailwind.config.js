/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metallic: {
          950: '#060607',
          900: '#0E0E10',
          850: '#151518',
          800: '#1D1D21',
          700: '#2A2A30',
          600: '#3E3E47',
          500: '#5C5C68',
          400: '#8A8A99',
          300: '#BCBCC9',
          100: '#EDEDF2',
        },
        cream: {
          DEFAULT: '#F5F5ED',
          dim: '#E2E2D6',
        },
        sage: {
          DEFAULT: '#9AA889',
          glow: '#B4C4A3',
        },
        signal: {
          red: '#E03E3E',
          orange: '#E87A38',
          green: '#2AC769',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'dot-matrix': 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.16)',
        'glow-sage': '0 0 20px -3px rgba(154, 168, 137, 0.3)',
      }
    },
  },
  plugins: [],
}
