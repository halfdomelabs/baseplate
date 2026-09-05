import type React from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#src/utils/index.js';

/**
 * A titled group of content within a page.
 *
 * Slots mirror `Card`: a header holding the title, an optional description and
 * optional actions, followed by the section's content as children.
 *
 * The title defaults to `h2`; pass `render` to pick the level that fits the
 * surrounding document.
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
          'grid auto-rows-min items-start gap-x-4',
          'has-data-[slot=section-actions]:grid-cols-[1fr_auto]',
          // Row gap only when there is a second row to separate, so a
          // title-only header is not padded by a phantom empty row.
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
          'min-w-0 text-2xl font-semibold tracking-tight',
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
          'max-w-3xl min-w-0 text-sm text-muted-foreground',
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
