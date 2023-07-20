import * as TabsPrimitive from '@radix-ui/react-tabs';
import clsx from 'clsx';
import * as React from 'react';

// adapted from https://ui.shadcn.com/docs/components/tabs
/* eslint-disable react/prop-types */

const List = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={clsx(
      'inline-flex h-9 items-center justify-center rounded-lg bg-background-200 p-1 text-foreground-700',
      className
    )}
    {...props}
  />
));
List.displayName = TabsPrimitive.List.displayName;

const Trigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background-50 data-[state=active]:text-foreground-800 data-[state=active]:shadow',
      className
    )}
    {...props}
  />
));
Trigger.displayName = TabsPrimitive.Trigger.displayName;

const Content = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx(
      'mt-2 ring-offset-background-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
Content.displayName = TabsPrimitive.Content.displayName;

export const ToggleTabs = Object.assign(TabsPrimitive.Root, {
  List,
  Trigger,
  Content,
});
