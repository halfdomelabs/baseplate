import { Dialog, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { Fragment } from 'react';

type ModalWidth = 'small' | 'base' | 'large';

interface Props {
  className?: string;
  isOpen?: boolean;
  onClose(): void;
  children: React.ReactNode;
  width?: ModalWidth;
}

// Adapted from https://flowbite.com/docs/components/modal/

function getModalWidthClass(width: ModalWidth): string {
  switch (width) {
    case 'small':
      return 'w-72 md:w-72';
    case 'base':
      return 'w-72 md:w-[140rem]';
    case 'large':
      return 'w-72 md:w-[200rem]';
    default:
      throw new Error(`Unknown modal width: ${width as string}`);
  }
}

function Modal({
  className,
  isOpen,
  onClose,
  children,
  width = 'base',
}: Props): JSX.Element {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
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
            <Dialog.Panel
              className={classNames(
                'max-h-full overflow-y-auto rounded-lg bg-white shadow md:max-w-md',
                getModalWidthClass(width),
                className
              )}
            >
              {children}
            </Dialog.Panel>
          </Transition.Child>
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
}: ModalHeaderProps): JSX.Element {
  return (
    <div
      className={classNames(
        'flex items-start justify-between rounded-t px-4 pt-4',
        className
      )}
    >
      <Dialog.Title>{children}</Dialog.Title>
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
}: ModalBodyProps): JSX.Element {
  return <div className={classNames('p-4', className)}>{children}</div>;
};

interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

Modal.Footer = function ModalFooter({
  className,
  children,
}: ModalFooterProps): JSX.Element {
  return (
    <div
      className={classNames(
        'flex items-center justify-end space-x-2 rounded-b bg-gray-50 p-4',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Modal;
