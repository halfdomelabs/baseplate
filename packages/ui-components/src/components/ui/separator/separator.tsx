'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '#src/utils/index.js';

/**
 * Visually or semantically separates content.
 *
 * https://ui.shadcn.com/docs/components/separator
 */
function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props): React.ReactElement {
  return (
    <SeparatorPrimitive
      data-slot="separator-root"
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
