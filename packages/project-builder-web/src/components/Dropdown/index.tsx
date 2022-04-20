import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { useRef, useState } from 'react';
import { MdExpandMore } from 'react-icons/md';
import { usePopper } from 'react-popper';

interface Props {
  className?: string;
  buttonClassName?: string;
  children: React.ReactNode;
  buttonLabel: string;
}

function Dropdown({
  className,
  buttonClassName,
  children,
  buttonLabel,
}: Props): JSX.Element {
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
  });

  return (
    <div className={className}>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button
              ref={setReferenceElement}
              className={classNames(
                'w-44 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
                buttonClassName
              )}
            >
              {buttonLabel}
              <MdExpandMore className="ml-2 w-4 h-4" />
            </Menu.Button>
            <div
              ref={popperElementRef}
              style={styles.popper}
              {...attributes.popper}
            >
              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                beforeEnter={() => setPopperElement(popperElementRef.current)}
                afterLeave={() => setPopperElement(null)}
              >
                <Menu.Items className="absolute z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700">
                  <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                    {children}
                  </ul>
                </Menu.Items>
              </Transition>
            </div>
          </>
        )}
      </Menu>
    </div>
  );
}

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
