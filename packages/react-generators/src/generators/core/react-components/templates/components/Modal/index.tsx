// @ts-nocheck

import type { ReactElement } from 'react';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import clsx from 'clsx';
import { Fragment } from 'react';

type ModalWidth = 'small' | 'base' | 'large';

interface Props {
  className?: string;
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: ModalWidth;
}

// Adapted from https://flowbite.com/docs/components/modal/

function getModalWidthClass(width: ModalWidth): string {
  switch (width) {
    case 'small': {
      return 'w-72 md:w-72';
    }
    case 'base': {
      return 'w-72 md:w-[50rem]';
    }
    case 'large': {
      return 'w-72 md:w-[80rem]';
    }
    default: {
      throw new Error(`Unknown modal width: ${width as string}`);
    }
  }
}

function Modal({
  className,
  isOpen,
  onClose,
  children,
  width = 'base',
}: Props): ReactElement {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={clsx(
                'max-h-full overflow-y-auto rounded-lg bg-white shadow md:max-w-7xl',
                getModalWidthClass(width),
                className,
              )}
            >
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

interface ModalHeaderProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

Modal.Header = function ModalHeader({
  className,
  children,
  onClose,
}: ModalHeaderProps): ReactElement {
  return (
    <div
      className={clsx(
        'flex items-start justify-between rounded-t px-4 pt-4',
        className,
      )}
    >
      <DialogTitle>{children}</DialogTitle>
      {onClose && (
        <button
          type="button"
          className="-m-1.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          onClick={onClose}
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ModalBodyProps {
  className?: string;
  children: React.ReactNode;
}

Modal.Body = function ModalBody({
  className,
  children,
}: ModalBodyProps): ReactElement {
  return <div className={clsx('p-4', className)}>{children}</div>;
};

interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

Modal.Footer = function ModalFooter({
  className,
  children,
}: ModalFooterProps): ReactElement {
  return (
    <div
      className={clsx(
        'flex items-center justify-end space-x-2 rounded-b bg-gray-50 p-4',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Modal;
