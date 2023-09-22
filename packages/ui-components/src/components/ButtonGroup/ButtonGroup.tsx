import { clsx } from 'clsx';
import { MdExpandMore } from 'react-icons/md';
import { Button, ButtonProps } from '../Button/Button.js';
import { Dropdown, DropdownProps } from '../Dropdown/Dropdown';

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

interface ButtonGroupDropdownProps
  extends DropdownProps,
    Pick<ButtonProps, 'variant' | 'disabled' | 'size' | 'iconAfter'> {
  children: React.ReactNode;
  className?: string;
}

ButtonGroup.Dropdown = function ButtonGroupDropdown({
  children,
  defaultOpen,
  open,
  onOpenChange,
  modal,
  dir,
  className,
  iconAfter,
  ...buttonProps
}: ButtonGroupDropdownProps): JSX.Element {
  // TODO: Add border between primary buttons
  return (
    <Dropdown
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      dir={dir}
    >
      <Dropdown.Trigger asChild>
        <Button
          noBorder
          iconAfter={iconAfter || MdExpandMore}
          className={clsx(
            'h-inherit relative border-b border-r border-t border-secondary-300 last-of-type:rounded-r-md dark:border-secondary-700',
            className
          )}
          {...buttonProps}
        />
      </Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.Group>{children}</Dropdown.Group>
      </Dropdown.Content>
    </Dropdown>
  );
};
