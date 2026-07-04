/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#0d1117',
          panel: '#161b22',
          border: 'rgba(240, 246, 252, 0.1)',
          input: '#21262d',
          hover: '#30363d'
        },
        severity: {
          critical: '#f85149',
          high: '#ff9d3d',
          medium: '#e3b341',
          low: '#39c5cf'
        },
        accent: {
          blue: '#58a6ff',
          cyan: '#00f0ff',
          teal: '#39c5cf'
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace']
      },
      boxShadow: {
        'glow-critical': '0 0 12px rgba(248, 81, 73, 0.4)',
        'glow-high': '0 0 12px rgba(255, 157, 61, 0.3)',
        'glow-cyan': '0 0 12px rgba(0, 240, 255, 0.3)'
      }
    },
  },
  plugins: [],
}
