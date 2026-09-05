import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

/**
 * An interactive component which expands/collapses a panel.
 *
 * https://ui.shadcn.com/docs/components/collapsible
 */
function Collapsible({
  ...props
}: CollapsiblePrimitive.Root.Props): React.ReactElement {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: CollapsiblePrimitive.Trigger.Props): React.ReactElement {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

function CollapsibleContent({
  ...props
}: CollapsiblePrimitive.Panel.Props): React.ReactElement {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
