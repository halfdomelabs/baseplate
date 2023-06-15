import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

interface TabsProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * An accessible stylable Tabs component.
 */
export function Tabs({ className, children }: TabsProps): JSX.Element {
  return (
    <Tab.Group as="div" className={className}>
      {children}
    </Tab.Group>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

Tabs.List = function TabsList({
  className,
  children,
}: TabsListProps): JSX.Element {
  return (
    <Tab.List
      as="div"
      className={clsx('border-color mb-4 border-b', className)}
    >
      <ul className="-mb-px flex flex-wrap">{children}</ul>
    </Tab.List>
  );
};

interface TabsTabProps {
  className?: string;
  children: React.ReactNode;
}

Tabs.Tab = function TabsTab({
  className,
  children,
}: TabsTabProps): JSX.Element {
  return (
    <Tab
      as="li"
      className={clsx(
        'inline-block cursor-pointer rounded-t-sm border-b-2 border-transparent p-4 ',
        'hover:bg-background-100 dark:hover:bg-background-700',
        'text-secondary text-center text-sm font-semibold',
        'ui-selected:border-primary-700 ui-selected:text-primary-700 dark:ui-selected:border-primary-400 dark:ui-selected:text-primary-400',
        className
      )}
    >
      {children}
    </Tab>
  );
};

interface TabsPanelsProps {
  className?: string;
  children: React.ReactNode;
}

Tabs.Panels = function TabsPanels({
  className,
  children,
}: TabsPanelsProps): JSX.Element {
  return <Tab.Panels className={className}>{children}</Tab.Panels>;
};

interface TabsPanelProps {
  className?: string;
  children: React.ReactNode;
}

Tabs.Panel = function TabsPanel({
  className,
  children,
}: TabsPanelProps): JSX.Element {
  return <Tab.Panel className={clsx('', className)}>{children}</Tab.Panel>;
};
