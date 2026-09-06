import { cva } from 'class-variance-authority';

import { cn } from '../utils/cn';

export const inputVariants = cva(
  cn(
    'flex w-full min-w-0 rounded-lg py-1 transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80',
    'border border-input',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  ),
  {
    variants: {
      // `text-base md:text-sm` stops iOS zooming the page on focus; `xl` is
      // already at 16px so it does not need the small-screen bump.
      size: {
        sm: 'px-2 text-base md:text-sm',
        default: 'px-2.5 text-base md:text-sm',
        xl: 'px-4 text-base',
      },
      // Heights are set by `size` through `compoundVariants`; this axis only
      // picks whether the control is clamped to that height or grows past it.
      height: {
        default: '',
        flexible: '',
      },
      // `transparent` is for inputs whose parent paints the fill; leaving the
      // dark-mode tint out of it avoids compositing two fills over one area.
      background: {
        default: 'bg-control-background dark:bg-input/30',
        transparent: 'bg-transparent',
      },
    },
    compoundVariants: [
      { size: 'sm', height: 'default', class: 'h-7' },
      { size: 'sm', height: 'flexible', class: 'min-h-7' },
      { size: 'default', height: 'default', class: 'h-8' },
      { size: 'default', height: 'flexible', class: 'min-h-8' },
      { size: 'xl', height: 'default', class: 'h-11' },
      { size: 'xl', height: 'flexible', class: 'min-h-11' },
    ],
    defaultVariants: {
      size: 'default',
      height: 'default',
      background: 'default',
    },
  },
);

export const textareaVariants = cva(
  cn(
    'flex field-sizing-content w-full rounded-lg transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80',
    'border border-input bg-control-background dark:bg-input/30',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  ),
  {
    variants: {
      // `text-base md:text-sm` stops iOS zooming the page on focus; `xl` is
      // already at 16px so it does not need the small-screen bump.
      size: {
        sm: 'min-h-14 px-2 py-1.5 text-base md:text-sm',
        default: 'min-h-16 px-2.5 py-2 text-base md:text-sm',
        xl: 'min-h-20 px-4 py-2.5 text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);
