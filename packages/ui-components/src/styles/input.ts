import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-md py-2 pl-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      height: {
        default: 'h-10',
        flexible: 'min-h-10',
      },
      border: {
        default:
          'border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        none: 'border border-transparent',
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
      border: 'default',
      background: 'default',
      rightPadding: 'default',
    },
  },
);
