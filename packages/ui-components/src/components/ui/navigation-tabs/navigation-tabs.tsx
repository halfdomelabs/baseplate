import type * as React from 'react';

import { useRender } from '@base-ui/react/use-render';

import { cn } from '#src/utils/index.js';

/**
 * A tab-like interface that allows the user to navigate between different sections via links
 */
function NavigationTabs({
  className,
  children,
  ...props
}: React.ComponentProps<'nav'>): React.ReactElement {
  return (
    <nav {...props}>
      <div
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
          className,
        )}
        role="tablist"
      >
        {children}
      </div>
    </nav>
  );
}

function NavigationTabsItem({
  className,
  children,
  active,
  render,
  ...props
}: React.ComponentProps<'a'> & {
  active?: boolean;
  render?: useRender.ComponentProps<'a'>['render'];
}): React.ReactElement {
  return useRender({
    defaultTagName: 'a',
    props: {
      className: cn(
        'inline-flex w-full items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm',
        active && 'bg-background text-foreground shadow-sm',
        className,
      ),
      role: 'tab',
      ...props,
      children,
    },
    render,
    state: {
      slot: 'navigation-tabs-item',
    },
  });
}

export { NavigationTabs, NavigationTabsItem };
