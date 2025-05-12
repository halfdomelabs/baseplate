'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@src/utils';

/**
 * SidebarTabs are a set of tabs aligned vertically on the left sidebar, showing their respective content panels to the right.
 *
 * https://ui.shadcn.com/docs/components/tabs
 */
const SidebarTabsRoot = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>((props, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn('flex flex-row gap-4', props.className)}
    orientation="vertical"
    {...props}
  />
));

SidebarTabsRoot.displayName = 'SidebarTabs';

const SidebarTabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex h-full w-48 shrink-0 flex-col space-y-1',
      className,
    )}
    {...props}
  />
));
SidebarTabsList.displayName = TabsPrimitive.List.displayName;

const SidebarTabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex items-center px-4 py-2 text-left text-sm font-medium transition-colors',
      'hover:bg-muted focus:bg-muted focus:outline-hidden',
      'rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
      className,
    )}
    {...props}
  />
));
SidebarTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const SidebarTabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('grow focus:outline-hidden', className)}
    {...props}
  />
));
SidebarTabsContent.displayName = TabsPrimitive.Content.displayName;

export const SidebarTabs = Object.assign(SidebarTabsRoot, {
  List: SidebarTabsList,
  Trigger: SidebarTabsTrigger,
  Content: SidebarTabsContent,
});
