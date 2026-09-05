import type React from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#src/utils/index.js';

/**
 * The title and description block at the top of a page.
 *
 * Layout chrome — sticky positioning, borders, page padding — stays at the call
 * site. Title and description occupy the first grid column, so any other child
 * must place itself in column one. Actions sit alongside them, dropping below in
 * a narrow header.
 *
 * The title defaults to `h1`; pass `render` to choose the heading level.
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
          '@container/page-header grid auto-rows-min items-start gap-x-4',
          'has-data-[slot=page-header-actions]:grid-cols-[1fr_auto]',
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
          'col-start-1 min-w-0 text-3xl font-semibold tracking-tight',
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
          'col-start-1 max-w-3xl min-w-0 text-sm text-muted-foreground',
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
          '@max-sm/page-header:col-start-1 @max-sm/page-header:row-auto @max-sm/page-header:mt-2 @max-sm/page-header:justify-self-start',
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
