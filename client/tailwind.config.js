/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

// Custom color palette
const brandColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    DEFAULT: '#0ea5e9',
  },
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    DEFAULT: '#8b5cf6',
  },
  success: colors.emerald,
  warning: colors.amber,
  error: colors.rose,
  gray: colors.slate,
  ai: {
    blue: '#3b82f6',
    cyan: '#06b6d4',
    purple: '#8b5cf6',
    pink: '#ec4899',
  },
}

// Extended spacing scale
const spacing = Array.from({ length: 100 }).reduce((acc, _, i) => {
  acc[i] = `${i * 0.25}rem`
  return acc
}, {})

// Animation keyframes
const keyframes = {
  'wave': {
    '0%, 60%, 100%': { transform: 'scaleY(0.4)' },
    '30%': { transform: 'scaleY(1)' },
  },
  'pulse-slow': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  'fade-in': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  'slide-up': {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
}

// Animation classes
const animation = {
  'wave': 'wave 1.5s ease-in-out infinite',
  'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'float': 'float 6s ease-in-out infinite',
  'fade-in': 'fade-in 0.3s ease-out',
  'slide-up': 'slide-up 0.3s ease-out',
}

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        ...brandColors,
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes,
      animation,
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        heading: ['var(--font-heading)', ...fontFamily.sans],
      },
      spacing: {
        ...spacing,
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '192': '48rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
    plugin(function({ addUtilities, addVariant, e }) {
      // Glass morphism utilities
      const glassUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      }

      // Voice interface states
      const voiceUtilities = {
        '.voice-listening': {
          '--tw-ring-color': 'rgba(59, 130, 246, 0.5)',
          '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
          '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
          'box-shadow': 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)',
        },
        '.voice-processing': {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      }

      // Data visualization utilities
      const dataVizUtilities = {
        '.data-up': {
          '@apply text-green-500': {},
          '&::after': {
            content: '"↗"',
            marginLeft: '0.25rem',
          },
        },
        '.data-down': {
          '@apply text-red-500': {},
          '&::after': {
            content: '"↘"',
            marginLeft: '0.25rem',
          },
        },
      }

      // AI processing animations
      const aiAnimations = {
        '.ai-pulse': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '-4px',
            borderRadius: 'inherit',
            padding: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6)',
            backgroundSize: '400% 400%',
            animation: 'gradient 5s ease infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
        },
      }

      // Add all utilities
      addUtilities({
        ...glassUtilities,
        ...voiceUtilities,
        ...dataVizUtilities,
        ...aiAnimations,
        // Smooth scrolling for the entire document
        '.smooth-scroll': {
          scrollBehavior: 'smooth',
        },
        // Reduced motion utilities
        '@media (prefers-reduced-motion: reduce)': {
          '.motion-reduce': {
            '&, &::before, &::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        },
      })

      // Add variants for data states
      addVariant('data-state-active', '&[data-state="active"]')
      addVariant('data-state-checked', '&[data-state="checked"]')
      addVariant('data-state-selected', '&[data-state="selected"]')
      
      // Add RTL support
      addVariant('rtl', '&[dir="rtl"]')
      addVariant('ltr', '&[dir="ltr"]')
      
      // Add touch device variants
      addVariant('touch', '@media (pointer: coarse)')
      
      // Add high contrast mode
      addVariant('high-contrast', '@media (prefers-contrast: more)')
    }),
  ],
}
