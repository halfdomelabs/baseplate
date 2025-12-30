import { cva } from 'class-variance-authority';

export const selectTriggerVariants = cva(
  "border-input shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='text-'])]:text-muted-foreground flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
);

export const selectContentVariants = cva(
  'max-h-(--radix-select-content-available-height) origin-(--radix-select-content-transform-origin) bg-popover text-popover-foreground data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 relative z-50 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border shadow-md',
  {
    variants: {
      popper: {
        none: '',
        active:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
      },
    },
  },
);

// Replaces data-[disabled] with data-[disabled=true] since Radix sets disabled=false and adds aria-selected selector
// https://github.com/shadcn-ui/ui/issues/3256

export const selectItemVariants = cva(
  "outline-hidden aria-selected:bg-accent aria-selected:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      withFocus: {
        none: '',
        highlight: 'focus:bg-accent focus:text-accent-foreground',
      },
    },
  },
);

export const selectCheckVariants = cva(
  'absolute right-2 flex size-3.5 items-center justify-center',
);
