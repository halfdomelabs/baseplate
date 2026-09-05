// @ts-nocheck

import { cn } from '$cn';
import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  cn(
    'flex w-full min-w-0 rounded-lg px-2.5 py-1 text-base transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:disabled:bg-input/80',
    'border border-input',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  ),
  {
    variants: {
      height: {
        default: 'h-8',
        flexible: 'min-h-8',
      },
      // `transparent` is for inputs whose parent paints the fill; leaving the
      // dark-mode tint out of it avoids compositing two fills over one area.
      background: {
        default: 'bg-control-background dark:bg-input/30',
        transparent: 'bg-transparent',
      },
    },
    defaultVariants: {
      height: 'default',
      background: 'default',
    },
  },
);
