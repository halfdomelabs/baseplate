import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import headlessUi from '@headlessui/tailwindcss';
import plugin from 'tailwindcss/plugin';
import tailwindCssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    fontFamily: {
      body: ['Geist Sans', ...defaultTheme.fontFamily.sans],
      mono: ['Geist Mono', ...defaultTheme.fontFamily.mono],
    },
    extend: {
      colors: {
        // surface colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        // interactive surfaces
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          hover: 'hsl(var(--destructive-hover))',
        },
        link: {
          DEFAULT: 'hsl(var(--link))',
          visited: 'hsl(var(--link-visited))',
        },
        // utility colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
    },
  },
  plugins: [
    headlessUi,
    tailwindCssAnimate,
    // custom typography plugin
    plugin(function ({ addBase, addUtilities, theme }) {
      addBase({
        h1: {
          fontSize: theme('fontSize.3xl'),
          fontWeight: theme('fontWeight.semibold'),
          letterSpacing: theme('letterSpacing.tight'),
          lineHeight: theme('lineHeight.none'),
        },
        h2: {
          fontSize: theme('fontSize.2xl'),
          fontWeight: theme('fontWeight.semibold'),
          lineHeight: theme('lineHeight.7'),
          letterSpacing: theme('letterSpacing.tight'),
        },
        h3: {
          fontSize: theme('fontSize.xl'),
          fontWeight: theme('fontWeight.semibold'),
          lineHeight: theme('lineHeight.6'),
          letterSpacing: theme('letterSpacing.tight'),
        },
        p: {
          lineHeight: theme('lineHeight.6'),
        },
      });
      addUtilities({
        '.text-style-lead': {
          fontSize: theme('fontSize.xl'),
          fontWeight: theme('fontWeight.medium'),
          lineHeight: theme('lineHeight.6'),
          color: theme('colors.muted.foreground'),
        },
        '.text-style-large': {
          fontSize: theme('fontSize.lg'),
          fontWeight: theme('fontWeight.semibold'),
          lineHeight: theme('lineHeight.6'),
        },
        '.text-style-small': {
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          lineHeight: theme('lineHeight.none'),
        },
        '.text-style-muted': {
          fontSize: theme('fontSize.sm'),
          lineHeight: theme('lineHeight.5'),
          color: theme('colors.muted.foreground'),
        },
        '.text-style-prose': {
          fontSize: theme('fontSize.base'),
          lineHeight: theme('lineHeight.6'),
          '& a': {
            color: theme('colors.link.DEFAULT'),
            fontWeight: theme('fontWeight.medium'),
            '&:hover': {
              textDecoration: 'underline',
            },
            '&:visited': {
              color: theme('colors.link.visited'),
            },
          },
        },
      });
    }),
  ],
} satisfies Config;

export default config;
