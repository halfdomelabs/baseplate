import type { MouseEventHandler } from 'react';
import type React from 'react';

import { Transition } from '@headlessui/react';
import clsx from 'clsx';

interface Props {
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose?: MouseEventHandler;
  visible?: boolean;
}

function Toast({
  className,
  icon,
  visible,
  children,
  onClose,
}: Props): React.JSX.Element {
  return (
    <Transition
      show={visible}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={clsx(
          'flex w-full max-w-xs items-center rounded-lg bg-white p-4 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400',
          visible && '-top-96',
          className,
        )}
        role="alert"
      >
        {icon}
        <div className="ml-3 text-sm font-normal">{children}</div>
        <button
          type="button"
          className="-m-1.5 ml-auto inline-flex size-8 rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Close"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg
            className="size-5"
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
      </div>
    </Transition>
  );
}

export default Toast;
