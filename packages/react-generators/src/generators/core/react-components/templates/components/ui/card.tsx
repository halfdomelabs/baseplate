// @ts-nocheck

import type * as React from 'react';

import { cn } from '$cn';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

/**
 * Displays a card with header, content, and footer.
 *
 * ShadCN changes:
 * - CardTitle accepts `render` so consumers can pick the heading element
 *
 * https://ui.shadcn.com/docs/components/card
 */
function Card({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      { className: cn('leading-none font-semibold', className) },
      props,
    ),
    render,
    state: { slot: 'card-title' },
  });
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
