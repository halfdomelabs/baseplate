import type React from 'react';

import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { MdLock } from 'react-icons/md';

interface PluginRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  disabledToggle?: boolean;
  /** Shown as "Required by {label}" inline help under the description. */
  forcedByLabel?: string;
  /** When true, the row is collapsible; clicking the header toggles open. */
  expandable?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

/**
 * Stops click/key events on the right-side switch from also bubbling up to
 * the CollapsibleTrigger that wraps the row header.
 */
function stopRowTriggerEvents(): {
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
} {
  return {
    onClick: (e) => {
      e.stopPropagation();
    },
    onKeyDown: (e) => {
      e.stopPropagation();
    },
    onPointerDown: (e) => {
      e.stopPropagation();
    },
  };
}

export function PluginRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabledToggle = false,
  forcedByLabel,
  expandable = false,
  defaultOpen = false,
  children,
}: PluginRowProps): React.ReactElement {
  const headerContent = (
    <>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-5"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <span className="text-sm font-medium leading-none">{title}</span>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className="flex shrink-0 items-center gap-2"
        {...stopRowTriggerEvents()}
      >
        {forcedByLabel ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={`Required by ${forcedByLabel}`}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                />
              }
            >
              <MdLock className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Required by {forcedByLabel}</TooltipContent>
          </Tooltip>
        ) : null}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={disabledToggle}
          aria-label={title}
          nativeButton
          render={<button type="button" />}
        />
      </div>
    </>
  );

  if (!expandable) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors">
        {headerContent}
      </div>
    );
  }

  return (
    <Collapsible
      defaultOpen={defaultOpen && enabled}
      open={enabled ? undefined : false}
      className="group/row overflow-hidden rounded-lg border bg-card transition-colors data-panel-open:border-primary/30"
    >
      <CollapsibleTrigger
        disabled={!enabled}
        nativeButton={false}
        render={<div role="button" tabIndex={enabled ? 0 : -1} />}
        className={cn(
          'flex w-full items-center gap-3 p-4 text-left outline-none',
          enabled ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {headerContent}
      </CollapsibleTrigger>
      {enabled ? (
        <CollapsibleContent>
          <div className="border-t bg-muted/30 px-4 py-4">{children}</div>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}
