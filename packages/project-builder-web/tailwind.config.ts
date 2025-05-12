import type { Config } from 'tailwindcss';

import path from 'node:path';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
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
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(
      path.dirname(require.resolve('@halfdomelabs/ui-components')),
      '**/*.{js,jsx,ts,tsx}',
    ),
  ],
} satisfies Config;
