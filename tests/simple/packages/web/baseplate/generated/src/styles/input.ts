import { cva } from 'class-variance-authority';

import { cn } from '../utils/cn';

export const inputVariants = cva(
  cn(
    'shadow-xs selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 flex w-full min-w-0 rounded-md bg-transparent py-1 pl-3 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    'border-input border',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  ),
  {
    variants: {
      height: {
        default: 'h-9',
        flexible: 'min-h-9',
      },
      background: {
        default: 'bg-background',
        transparent: '',
      },
      rightPadding: {
        default: 'pr-3',
        none: '',
      },
    },
    defaultVariants: {
      height: 'default',
      background: 'default',
      rightPadding: 'default',
    },
  },
);
