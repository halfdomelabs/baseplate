import { cn } from '@src/utils';

/**
 * Use to show a placeholder while content is loading.
 *
 * https://ui.shadcn.com/docs/components/skeleton
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
