'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import {clsx} from 'clsx';
import * as React from 'react';

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={clsx('border-color mb-4 border-b px-2', className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx(
      'inline-block cursor-pointer rounded-t-sm border-b-2 border-transparent p-4 ',
      'hover:bg-background-100 dark:hover:bg-background-700',
      'text-secondary text-center text-sm font-semibold',
      'data-[state=active]:border-primary-700 data-[state=active]:text-primary-700 dark:data-[state=active]:border-primary-400 dark:data-[state=active]:text-primary-400',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx(
      'ring-offset-background mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export interface TabsProps extends TabsPrimitive.TabsProps {
  children: React.ReactNode;
}
export function Tabs({ children, ...rest }: TabsProps): JSX.Element {
  return <TabsPrimitive.Root {...rest}>{children}</TabsPrimitive.Root>;
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
