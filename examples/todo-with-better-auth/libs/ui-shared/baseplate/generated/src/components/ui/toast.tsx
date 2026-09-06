'use client';

import type * as React from 'react';

import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { MdClose } from 'react-icons/md';

import { cn } from '../../utils/cn.js';
import { Button } from './button.js';

/**
 * The manager backing the exported `toast` helpers. A renderer other than
 * `Toaster` must pass it to `ToastProvider`, or `toast.*` calls reach nothing.
 */
const toastManager = ToastPrimitive.createToastManager();

function ToastViewport({
  className,
  ...props
}: ToastPrimitive.Viewport.Props): React.ReactElement {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full',
        className,
      )}
      {...props}
    />
  );
}

function Toast({
  className,
  ...props
}: ToastPrimitive.Root.Props): React.ReactElement {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        'group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-lg border bg-tone text-sm text-tone-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'tone-default data-[type=error]:tone-error data-[type=success]:tone-success data-[type=warning]:tone-warning',
        '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
        'h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]',
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        'data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
        'data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]',
        '[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
        'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
        'data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
        'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
        'data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        'data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
        'data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
        'data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
        'data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        className,
      )}
      {...props}
    />
  );
}

function ToastContent({
  className,
  ...props
}: ToastPrimitive.Content.Props): React.ReactElement {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        'flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({
  className,
  ...props
}: ToastPrimitive.Title.Props): React.ReactElement {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props): React.ReactElement {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-sm text-tone-muted-foreground', className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props): React.ReactElement {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props): React.ReactElement {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 text-tone-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-tone-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <MdClose aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastProvider({
  ...props
}: ToastPrimitive.Provider.Props): React.ReactElement {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({
  ...props
}: ToastPrimitive.Portal.Props): React.ReactElement {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastList(): React.ReactElement[] {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle className={cn(!toastItem.description && 'font-normal')} />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/**
 * Renders the toasts queued by the `toast` helpers.
 *
 * Mount once near the app root. It portals to the body, so it does not need to
 * be an ancestor of the code calling `toast.*`. To render a different layout,
 * compose `ToastProvider` / `ToastPortal` / `ToastViewport` and the parts
 * directly, passing the exported `toastManager` so `toast.*` still reaches it.
 *
 * ShadCN changes:
 * - The surface fills with the `tone-*` utilities keyed off `data-type` rather
 *   than a neutral popover colour, so no status icons are rendered; the border
 *   stays upstream's neutral `--border`
 * - `rounded-lg` and `text-sm` rather than upstream's `rounded-2xl` and
 *   inherited size, matching the rest of the library's surfaces
 * - Auto-dismisses after 3s rather than Base UI's 5s
 * - The title drops to `font-normal` when the toast carries no description
 * - Exports a `toast` facade instead of the raw manager, so the tone is a typed
 *   method rather than an open `type` string and `priority` follows from it
 * - `createToastManager` and `useToastManager` are not re-exported; import them
 *   from `@base-ui/react/toast`
 */
function Toaster({
  children,
  toastManager: manager = toastManager,
  timeout = 3000,
  ...props
}: ToastPrimitive.Provider.Props): React.ReactElement {
  return (
    <ToastProvider toastManager={manager} timeout={timeout} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

/** The tones a toast can render in. */
export type ToastType = 'default' | 'success' | 'warning' | 'error';

/** Options shared by every `toast` helper. */
export interface ToastOptions {
  /** Supporting detail rendered under the message. */
  description?: React.ReactNode;
  /** Props for the toast's action button; `children` is its label. */
  actionProps?: React.ComponentPropsWithoutRef<'button'>;
  /**
   * How urgently screen readers announce the toast. Defaults to `high` for
   * errors and `low` for every other tone.
   */
  priority?: 'low' | 'high';
  /** Milliseconds before auto-dismissal. `0` keeps the toast until dismissed. */
  timeout?: number;
  /** Reuses the toast with this id, updating it in place. */
  id?: string;
  /** Called once the toast closes. */
  onClose?: () => void;
}

/** Options for `toast.update`. The id comes from the first argument. */
export interface ToastUpdateOptions extends Omit<ToastOptions, 'id'> {
  /** The toast's message. */
  message?: React.ReactNode;
  /** The tone to switch to. */
  type?: ToastType;
}

function priorityFor(type: ToastType): 'low' | 'high' {
  return type === 'error' ? 'high' : 'low';
}

function addToast(
  type: ToastType,
  message: React.ReactNode,
  options?: ToastOptions,
): string {
  return toastManager.add({
    title: message,
    type,
    priority: priorityFor(type),
    ...options,
  });
}

/**
 * Shows a toast from anywhere, including outside React.
 *
 * Requires a `Toaster` mounted somewhere in the app. Each helper takes the
 * message as its first argument and returns the toast's id, for `update` and
 * `dismiss`.
 */
const toast = {
  /** Shows a toast in the default tone. */
  message: (message: React.ReactNode, options?: ToastOptions): string =>
    addToast('default', message, options),
  success: (message: React.ReactNode, options?: ToastOptions): string =>
    addToast('success', message, options),
  warning: (message: React.ReactNode, options?: ToastOptions): string =>
    addToast('warning', message, options),
  error: (message: React.ReactNode, options?: ToastOptions): string =>
    addToast('error', message, options),
  /**
   * Replaces parts of a live toast. Base UI merges the update over the toast,
   * so only the fields given are forwarded — passing `{ timeout }` alone leaves
   * the message untouched.
   */
  update: (id: string, options: ToastUpdateOptions): void => {
    const { message, type, priority, ...rest } = options;
    toastManager.update(id, {
      ...rest,
      ...(message !== undefined && { title: message }),
      ...(type !== undefined && { type, priority: priorityFor(type) }),
      ...(priority !== undefined && { priority }),
    });
  },
  /** Dismisses one toast, or every toast when called with no id. */
  dismiss: (id?: string): void => {
    toastManager.close(id);
  },
};

export {
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  toastManager,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
