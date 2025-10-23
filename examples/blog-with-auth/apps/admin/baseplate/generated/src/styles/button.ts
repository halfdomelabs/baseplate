import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'border-input bg-primary text-primary-foreground hover:bg-primary-hover border text-sm',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover text-sm',
        outline:
          'border-input bg-background hover:bg-accent hover:text-accent-foreground border text-sm',
        secondary:
          'border-input bg-secondary text-secondary-foreground hover:bg-secondary-hover border text-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground text-sm',
        ghostDestructive: 'text-destructive hover:bg-accent text-sm',
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
