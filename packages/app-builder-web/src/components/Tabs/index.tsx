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
        'text-sm font-semibold text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700',
        className
      )}
    >
      <ul className="flex flex-wrap -mb-px">{children}</ul>
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
            'inline-block p-4 rounded-t-lg border-b-2 border-transparent',
            {
              'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500':
                selected,
              'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
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
        'p-4 border border-gray-200 rounded-b-lg bg-gray-100',
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
