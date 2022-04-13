import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { MdExpandMore } from 'react-icons/md';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function Dropdown({ className, children }: Props): JSX.Element {
  return (
    <div className={classNames('', className)}>
      <Menu>{children}</Menu>
    </div>
  );
}

interface DropdownButtonProps {
  className?: string;
  children: React.ReactNode;
}

Dropdown.Button = function DropdownButton({
  className,
  children,
}: DropdownButtonProps): JSX.Element {
  return (
    <Menu.Button
      className={classNames(
        'w-44 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
        className
      )}
    >
      {children}
      <MdExpandMore className="ml-2 w-4 h-4" />
    </Menu.Button>
  );
};

interface DropdownItemsProps {
  className?: string;
  children: React.ReactNode;
}

Dropdown.Items = function DropdownItems({
  className,
  children,
}: DropdownItemsProps): JSX.Element {
  return (
    <Transition
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Menu.Items
        className={classNames(
          'absolute z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700',
          className
        )}
      >
        <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
          {children}
        </ul>
      </Menu.Items>
    </Transition>
  );
};

interface DropdownItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

Dropdown.ButtonItem = function DropdownItem({
  className,
  children,
  onClick,
}: DropdownItemProps): JSX.Element {
  return (
    <Menu.Item>
      <li>
        <button
          type="button"
          onClick={onClick}
          className={classNames(
            'block text-left w-full py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white',
            className
          )}
        >
          {children}
        </button>
      </li>
    </Menu.Item>
  );
};

export default Dropdown;
