import { cva } from 'class-variance-authority';

export const selectContentVariants = cva(
  'relative z-50 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
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

export const selectItemVariants = cva(
  'relative flex w-full items-center rounded-xs py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
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
  'absolute right-2 flex size-4 items-center justify-center',
);
