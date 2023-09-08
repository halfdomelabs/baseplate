import { z } from 'zod';

export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const themeSchema = z.object({
  name: z.string().min(1),
  baseThemeColor: z.string().min(1),
  colors: z.object({
    background: hexColor,
    foreground: hexColor,
    muted: hexColor,
    mutedForeground: hexColor,
    card: hexColor,
    cardForeground: hexColor,
    popover: hexColor,
    popoverForeground: hexColor,
    border: hexColor,
    inputBorder: hexColor,
    primary: hexColor,
    primaryForeground: hexColor,
    secondary: hexColor,
    secondaryForeground: hexColor,
    accent: hexColor,
    accentForeground: hexColor,
    destructive: hexColor,
    destructiveForeground: hexColor,
    ring: hexColor,
    link: hexColor,
    linkHover: hexColor,
    linkVisited: hexColor,
  }),
  radius: z.number().min(0),
});

export type ThemeConfig = z.infer<typeof themeSchema>;
