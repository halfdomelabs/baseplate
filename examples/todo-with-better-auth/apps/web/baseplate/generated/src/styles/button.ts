import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        ghostDestructive: 'text-sm text-destructive hover:bg-accent',
        link: 'text-link underline-offset-4 hover:underline',
        linkDestructive: 'text-destructive underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 gap-2 px-4 py-2 has-[>svg]:px-3',
        none: '',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 gap-2 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
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
