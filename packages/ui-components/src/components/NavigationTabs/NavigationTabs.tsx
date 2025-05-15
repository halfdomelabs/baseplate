import type React from 'react';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';

import { cn } from '@src/utils';

/**
 * A tab-like interface that allows the user to navigate between different sections via links
 */
function NavigationTabs({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<
  typeof NavigationMenuPrimitive.Root
>): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Root {...props} asChild orientation="horizontal">
      <NavigationMenuPrimitive.List
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
          className,
        )}
      >
        {children}
      </NavigationMenuPrimitive.List>
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationTabsItem({
  className,
  children,
  asChild,
  ...props
}: React.ComponentPropsWithRef<
  typeof NavigationMenuPrimitive.Link
>): React.ReactElement {
  return (
    <NavigationMenuPrimitive.Item className={cn('flex-1', className)}>
      <NavigationMenuPrimitive.Link
        className="inline-flex w-full items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        asChild={asChild}
        {...props}
      >
        {children}
      </NavigationMenuPrimitive.Link>
    </NavigationMenuPrimitive.Item>
  );
}

export { NavigationTabs, NavigationTabsItem };
