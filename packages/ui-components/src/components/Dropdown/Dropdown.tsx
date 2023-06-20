import { Menu, Portal, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { Fragment, useMemo, useRef, useState } from 'react';
import { MdExpandMore } from 'react-icons/md';
import { Modifier, usePopper } from 'react-popper';
import { Button, ButtonProps } from '../Button/Button.js';

export interface DropdownProps
  extends Pick<ButtonProps, 'variant' | 'disabled' | 'size'> {
  className?: string;
  buttonClassName?: string;
  children: React.ReactNode;
  buttonLabel?: string;
  fixed?: boolean;
  noButtonBorder?: boolean;
}

export function Dropdown({
  className,
  children,
  buttonLabel,
  fixed,
  noButtonBorder,
  variant,
  disabled,
  size,
}: DropdownProps): JSX.Element {
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();

  // adapted from https://github.com/floating-ui/floating-ui/issues/794#issuecomment-824220211
  const modifiers: Modifier<'offset' | 'sameWidth'>[] = useMemo(
    () => [{ name: 'offset', options: { offset: [0, 4] } }],
    []
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
    modifiers,
    strategy: fixed ? 'fixed' : undefined,
  });

  const PortalWrapper = fixed ? Portal : Fragment;

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button
            noBorder={noButtonBorder}
            ref={setReferenceElement}
            as={Button}
            className={clsx(className)}
            iconAfter={MdExpandMore}
            variant={variant}
            disabled={disabled}
            size={size}
          >
            {buttonLabel}
          </Menu.Button>
          <PortalWrapper>
            <div
              ref={popperElementRef}
              style={styles.popper}
              {...attributes.popper}
            >
              <Transition
                show={open}
                enter="ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
                beforeEnter={() => setPopperElement(popperElementRef.current)}
                afterLeave={() => setPopperElement(null)}
              >
                <Menu.Items
                  as="ul"
                  className="popover-background border-normal min-w-[150px] rounded p-2 shadow"
                >
                  {children}
                </Menu.Items>
              </Transition>
            </div>
          </PortalWrapper>
        </>
      )}
    </Menu>
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
      <li className="w-full">
        <button
          type="button"
          onClick={onClick}
          className={clsx(
            'w-full cursor-pointer rounded p-2 text-left text-sm hover:bg-background-200 dark:hover:bg-background-700',
            className
          )}
        >
          {children}
        </button>
      </li>
    </Menu.Item>
  );
};
