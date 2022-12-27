import { Tab } from '@headlessui/react';
import classNames from 'classnames';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function Tabs({ className, children }: Props): JSX.Element {
  return (
    <div className={classNames('', className)}>
      <Tab.Group>{children}</Tab.Group>
    </div>
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
      className={classNames(
        'border-b border-gray-200 text-center text-sm font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400',
        className
      )}
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
    <Tab as="li" className={classNames('mr-2 cursor-pointer', className)}>
      {({ selected }) => (
        <span
          className={classNames(
            'inline-block rounded-t-lg border-b-2 border-transparent p-4',
            {
              'active border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500':
                selected,
              'hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300':
                !selected,
            }
          )}
        >
          {children}
        </span>
      )}
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
  return (
    <Tab.Panels
      className={classNames(
        'rounded-b-lg border border-gray-200 bg-gray-100 p-4',
        className
      )}
    >
      {children}
    </Tab.Panels>
  );
};

interface TabsPanelProps {
  className?: string;
  children: React.ReactNode;
}

Tabs.Panel = function TabsPanel({
  className,
  children,
}: TabsPanelProps): JSX.Element {
  return (
    <Tab.Panel className={classNames('', className)}>{children}</Tab.Panel>
  );
};

export default Tabs;
