import { clsx } from 'clsx';
import { Button, ButtonProps } from '../Button/Button.js';
import { Dropdown, DropdownProps } from '../Dropdown/Dropdown.js';

interface ButtonGroupProps {
  className?: string;
  children: React.ReactNode;
}

export function ButtonGroup({
  className,
  children,
}: ButtonGroupProps): JSX.Element {
  return (
    <div className={clsx('inline-flex rounded-md shadow', className)}>
      {children}
    </div>
  );
}

interface ButtonGroupButtonProps extends Omit<ButtonProps, 'noBorder'> {
  children: React.ReactNode;
}

ButtonGroup.Button = function ButtonGroupButton({
  className,
  children,
  ...props
}: ButtonGroupButtonProps): JSX.Element {
  // TODO: Add border between primary buttons
  return (
    <Button
      noBorder
      className={clsx(
        'relative border-b border-r border-t border-secondary-300 first-of-type:rounded-l-md first-of-type:border-l last-of-type:rounded-r-md dark:border-secondary-700',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

interface ButtonGroupDropdownProps extends Omit<DropdownProps, 'noBorder'> {
  children: React.ReactNode;
}

ButtonGroup.Dropdown = function ButtonGroupDropdown({
  className,
  children,
  ...props
}: ButtonGroupDropdownProps): JSX.Element {
  // TODO: Add border between primary buttons
  return (
    <Dropdown
      noButtonBorder
      className={clsx(
        'relative border-b border-r border-t border-secondary-300 first-of-type:rounded-l-md first-of-type:border-l last-of-type:rounded-r-md dark:border-secondary-700',
        className
      )}
      {...props}
    >
      {children}
    </Dropdown>
  );
};
