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
          bg: '#080B14',
          secondary: '#111827',
          card: '#151D2E',
          cardHover: '#1A2438',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(59, 130, 246, 0.4)',
        },
        brand: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          green: '#22C55E',
          orange: '#F59E0B',
          red: '#EF4444',
        },
        primary: {
          text: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#64748B',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 25px -4px rgba(59, 130, 246, 0.35)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 25px -4px rgba(139, 92, 246, 0.35)',
        'glow-red': '0 0 25px -4px rgba(239, 68, 68, 0.40)',
        'glow-green': '0 0 25px -4px rgba(34, 197, 94, 0.35)',
        'glow-orange': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dark-radial': 'radial-gradient(circle at 50% 0%, #172554 0%, #080B14 70%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(21, 29, 46, 0.85) 0%, rgba(17, 24, 39, 0.70) 100%)',
      }
    },
  },
  plugins: [],
}
