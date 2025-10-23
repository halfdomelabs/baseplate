import { cn } from '@src/utils/cn';

/**
 * A skeleton component that can be used to show a loading state.
 *
 * https://ui.shadcn.com/docs/components/skeleton
 */
function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-accent', className)}
      {...props}
    />
  );
}

export { Skeleton };
