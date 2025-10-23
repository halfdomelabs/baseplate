import { cva } from 'class-variance-authority';

import { cn } from '../utils/cn';

export const inputVariants = cva(
  cn(
    'flex w-full min-w-0 rounded-md bg-transparent py-1 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
    'border border-input',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
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
    },
    defaultVariants: {
      height: 'default',
      background: 'default',
    },
  },
);
