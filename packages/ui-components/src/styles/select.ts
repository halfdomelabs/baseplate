import { cva } from 'class-variance-authority';

export const selectContentVariants = cva(
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
  {
    variants: {
      popper: {
        none: '',
        active:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
      },
    },
  }
);

export const selectItemVariants = cva(
  'relative flex w-full aria-selected:bg-accent aria-selected:text-accent-foreground select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:cursor-pointer focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
);

export const selectCheckVariants = cva(
  'absolute right-2 flex h-4 w-4 items-center justify-center'
);
