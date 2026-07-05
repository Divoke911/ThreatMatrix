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
          base: 'var(--color-dark-base, #0d1117)',
          panel: 'var(--color-dark-panel, #161b22)',
          border: 'var(--color-dark-border, rgba(240, 246, 252, 0.1))',
          input: 'var(--color-dark-input, #21262d)',
          hover: 'var(--color-dark-hover, #30363d)'
        },
        severity: {
          critical: 'var(--color-severity-critical, #f85149)',
          high: 'var(--color-severity-high, #ff9d3d)',
          medium: 'var(--color-severity-medium, #e3b341)',
          low: 'var(--color-severity-low, #39c5cf)'
        },
        accent: {
          blue: 'var(--color-accent-blue, #58a6ff)',
          cyan: 'var(--color-accent-cyan, #00f0ff)',
          teal: 'var(--color-accent-teal, #39c5cf)',
          lime: 'var(--color-accent-lime, #b3ff00)'
        },
        text: {
          primary: 'var(--color-text-primary, #e6edf3)',
          secondary: 'var(--color-text-secondary, #8b949e)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace']
      },
      boxShadow: {
        'glow-critical': '0 0 12px rgba(248, 81, 73, 0.4)',
        'glow-high': '0 0 12px rgba(255, 157, 61, 0.3)',
        'glow-cyan': '0 0 12px rgba(0, 240, 255, 0.3)',
        'glow-lime': '0 0 15px rgba(179, 255, 0, 0.3)'
      }
    },
  },
  plugins: [],
}
