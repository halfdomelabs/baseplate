import type React from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '@src/utils/cn';

/**
 * A titled group of content within a page.
 *
 * Slots mirror `Card`, with the section's content as children. Title and
 * description occupy the first grid column, so any other child of the header
 * must place itself in column one. Actions sit alongside them, dropping below in
 * a narrow header.
 *
 * The title defaults to `h2`; pass `render` to choose the heading level.
 */
function Section({
  className,
  render,
  ...props
}: useRender.ComponentProps<'section'>): React.ReactElement {
  return useRender({
    defaultTagName: 'section',
    props: mergeProps<'section'>(
      { className: cn('space-y-4', className) },
      props,
    ),
    render,
    state: { slot: 'section' },
  });
}

function SectionHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          '@container/section-header grid auto-rows-min items-start gap-x-4',
          'has-data-[slot=section-actions]:grid-cols-[1fr_auto]',
          'has-data-[slot=section-description]:gap-y-2',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'section-header' },
  });
}

function SectionTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<'h2'>): React.ReactElement {
  return useRender({
    defaultTagName: 'h2',
    props: mergeProps<'h2'>(
      {
        className: cn(
          'col-start-1 min-w-0 text-2xl font-semibold tracking-tight',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'section-title' },
  });
}

function SectionDescription({
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
    state: { slot: 'section-description' },
  });
}

function SectionActions({
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
          '@max-sm/section-header:col-start-1 @max-sm/section-header:row-auto @max-sm/section-header:mt-2 @max-sm/section-header:justify-self-start',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'section-actions' },
  });
}

export {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionTitle,
};
