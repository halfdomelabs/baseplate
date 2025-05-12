import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import React from 'react';

import { cn } from '@src/utils';

/**
 * A tab-like interface that allows the user to navigate between different sections via links
 */
const NavigationTabsRoot = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    {...props}
    ref={ref}
    asChild
    orientation="horizontal"
  >
    <NavigationMenuPrimitive.List
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className,
      )}
    >
      {children}
    </NavigationMenuPrimitive.List>
  </NavigationMenuPrimitive.Root>
));

NavigationTabsRoot.displayName = 'NavigationTabs';

const NavigationTabsItem = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, children, asChild, ...props }, ref) => (
  <NavigationMenuPrimitive.Item ref={ref} className={cn('flex-1', className)}>
    <NavigationMenuPrimitive.Link
      className="inline-flex w-full items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
      asChild={asChild}
      {...props}
    >
      {children}
    </NavigationMenuPrimitive.Link>
  </NavigationMenuPrimitive.Item>
));

NavigationTabsItem.displayName = 'NavigationTabsItem';

export const NavigationTabs = Object.assign(NavigationTabsRoot, {
  Item: NavigationTabsItem,
});
