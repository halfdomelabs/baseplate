'use client';

import type * as React from 'react';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

/**
 * An interactive component which expands/collapses a panel.
 *
 * https://ui.shadcn.com/docs/components/collapsible
 */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>): React.ReactElement {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<
  typeof CollapsiblePrimitive.CollapsibleTrigger
>): React.ReactElement {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<
  typeof CollapsiblePrimitive.CollapsibleContent
>): React.ReactElement {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
