import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center gap-2 rounded-md font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden active:brightness-95 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-input bg-primary text-sm text-primary-foreground hover:bg-primary-hover',
        destructive:
          'bg-destructive text-sm text-destructive-foreground hover:bg-destructive-hover',
        outline:
          'border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'border border-input bg-secondary text-sm text-secondary-foreground hover:bg-secondary-hover',
        ghost: 'text-sm hover:bg-accent hover:text-accent-foreground',
        link: 'text-link underline-offset-4 hover:underline',
        destructiveLink: 'text-destructive underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        none: '',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-8',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      justify: 'center',
    },
  },
);
