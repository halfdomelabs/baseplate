import type React from 'react';

import { cn } from '../../utils/cn.js';

/**
 * The title and description block at the top of a page.
 *
 * Layout chrome around it — sticky positioning, borders, page padding — stays
 * at the call site.
 *
 * Title and description stack in the first grid column while actions sit
 * alongside them, so any other child must place itself in column one.
 */
function PageHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="page-header"
      className={cn(
        'grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2',
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>): React.ReactElement {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        'col-start-1 min-w-0 text-3xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement {
  return (
    <p
      data-slot="page-header-description"
      className={cn(
        'col-start-1 max-w-3xl min-w-0 text-sm text-muted-foreground',
        '[&>a]:link',
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        'col-start-2 row-start-1 flex shrink-0 items-center gap-2',
        className,
      )}
      {...props}
    />
  );
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
};
