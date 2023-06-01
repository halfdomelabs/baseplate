import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { Fragment } from 'react';
import { HiXMark } from 'react-icons/hi2';
import { Button } from '../Button/Button.js';

/**
 * Represents the size options for the Dialog component.
 */
type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Represents the props for the Dialog component.
 */
export interface DialogProps {
  /**
   * Additional CSS class name for the component.
   */
  className?: string;
  /**
   * Specifies whether the Dialog is open or closed.
   */
  isOpen?: boolean;
  /**
   * Callback function called when the Dialog is closed.
   */
  onClose(): void;
  /**
   * The content to be rendered inside the Dialog.
   */
  children: React.ReactNode;
  /**
   * The size of the Dialog.
   */
  size?: DialogSize;
}

function getDialogSizeClass(size: DialogSize): string {
  return clsx(
    size === 'sm' && 'w-72',
    size === 'md' && 'w-72 md:w-[30rem]',
    size === 'lg' && 'w-72 md:w-[40rem]',
    size === 'xl' && 'w-72 md:w-[50rem]'
  );
}

/**
 * A Dialog component that can be used to display content in a modal.
 */
export function Dialog({
  className,
  isOpen,
  onClose,
  children,
  size = 'md',
}: DialogProps): JSX.Element {
  return (
    <Transition show={isOpen} as={Fragment}>
      <HeadlessDialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/10 dark:bg-white/10"
            aria-hidden="true"
          />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HeadlessDialog.Panel
              className={clsx(
                'max-h-full overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-secondary-900',
                getDialogSizeClass(size),
                className
              )}
            >
              {children}
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

Dialog.Header = function DialogHeader({
  className,
  children,
  onClose,
}: DialogHeaderProps): JSX.Element {
  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-t-lg px-4 pt-4',
        className
      )}
    >
      <HeadlessDialog.Title>{children}</HeadlessDialog.Title>
      {onClose && (
        <Button
          onClick={onClose}
          variant="tertiary"
          iconBefore={HiXMark}
          size="icon"
        />
      )}
    </div>
  );
};

interface DialogBodyProps {
  className?: string;
  children: React.ReactNode;
}

Dialog.Body = function DialogBody({
  className,
  children,
}: DialogBodyProps): JSX.Element {
  return <div className={clsx('px-4 pb-4 pt-2', className)}>{children}</div>;
};

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

Dialog.Footer = function DialogFooter({
  className,
  children,
}: DialogFooterProps): JSX.Element {
  return (
    <div
      className={clsx(
        'flex items-center justify-end space-x-4 rounded-b-lg border-t border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-600 dark:bg-secondary-800',
        className
      )}
    >
      {children}
    </div>
  );
};
