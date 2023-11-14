import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  'flex h-10 w-full px-3 py-2 rounded-md text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      border: {
        default:
          'border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        none: 'border border-transparent',
      },
      background: {
        default: 'bg-background',
        transparent: '',
      },
    },
    defaultVariants: {
      border: 'default',
      background: 'default',
    },
  }
);
