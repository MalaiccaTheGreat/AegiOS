// Design Tokens and Breakpoints for AegisOS

export const breakpoints = {
  // Mobile-first approach
  sm: '640px',    // Small screens (mobile)
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops
  xl: '1280px',   // Desktops
  '2xl': '1536px', // Large desktops
} as const;

export const device = {
  mobile: `(min-width: ${breakpoints.sm})`,
  tablet: `(min-width: ${breakpoints.md})`,
  laptop: `(min-width: ${breakpoints.lg})`,
  desktop: `(min-width: ${breakpoints.xl})`,
  ultraWide: `(min-width: ${breakpoints['2xl']})`,
} as const;

// Responsive typography scale
export const typography = {
  h1: {
    mobile: 'text-3xl leading-tight font-bold',
    tablet: 'md:text-4xl',
    desktop: 'lg:text-5xl',
  },
  h2: {
    mobile: 'text-2xl leading-tight font-bold',
    tablet: 'md:text-3xl',
    desktop: 'lg:text-4xl',
  },
  h3: {
    mobile: 'text-xl leading-tight font-semibold',
    tablet: 'md:text-2xl',
    desktop: 'lg:text-3xl',
  },
  body: {
    mobile: 'text-base leading-relaxed',
    tablet: 'md:text-lg',
    desktop: 'lg:text-base',
  },
  small: {
    mobile: 'text-sm',
    tablet: 'md:text-base',
    desktop: 'lg:text-sm',
  },
} as const;

// Context-specific theming
export const contexts = {
  accounting: {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-blue-100 text-blue-800',
    accent: 'bg-emerald-500',
  },
  construction: {
    primary: 'bg-amber-600 text-white',
    secondary: 'bg-amber-100 text-amber-800',
    accent: 'bg-orange-500',
  },
  retail: {
    primary: 'bg-purple-600 text-white',
    secondary: 'bg-purple-100 text-purple-800',
    accent: 'bg-pink-500',
  },
} as const;

// Touch target sizes (minimum 48x48px for touch)
export const touchTarget = {
  sm: 'h-10 min-w-[2.5rem] px-3',
  md: 'h-12 min-w-[3rem] px-4',
  lg: 'h-14 min-w-[3.5rem] px-5',
  xl: 'h-16 min-w-[4rem] px-6',
} as const;

// Animation durations
export const durations = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  banner: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;
