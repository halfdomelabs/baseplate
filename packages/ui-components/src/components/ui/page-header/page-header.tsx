import type React from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#src/utils/index.js';

/**
 * The title and description block at the top of a page.
 *
 * Layout chrome around it — sticky positioning, borders, page padding — stays
 * at the call site.
 *
 * Title and description stack in the first grid column; actions sit alongside
 * them and the second column only exists when actions are present.
 *
 * The title defaults to `h1`; pass `render` to pick the level that fits the
 * surrounding document.
 */
function PageHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'grid auto-rows-min items-start gap-x-4',
          'has-data-[slot=page-header-actions]:grid-cols-[1fr_auto]',
          // Row gap only when there is a second row to separate, so a
          // title-only header is not padded by a phantom empty row.
          'has-data-[slot=page-header-description]:gap-y-2',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'page-header' },
  });
}

function PageHeaderTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<'h1'>): React.ReactElement {
  return useRender({
    defaultTagName: 'h1',
    props: mergeProps<'h1'>(
      {
        className: cn(
          'min-w-0 text-3xl font-semibold tracking-tight',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'page-header-title' },
  });
}

function PageHeaderDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<'p'>): React.ReactElement {
  return useRender({
    defaultTagName: 'p',
    props: mergeProps<'p'>(
      {
        className: cn(
          'max-w-3xl min-w-0 text-sm text-muted-foreground',
          '[&>a]:inline-link',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'page-header-description' },
  });
}

function PageHeaderActions({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'col-start-2 row-span-2 row-start-1 flex shrink-0 items-center gap-2 self-start justify-self-end',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'page-header-actions' },
  });
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
};
