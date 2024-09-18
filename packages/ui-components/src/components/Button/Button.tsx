import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { buttonVariants } from '@src/styles';
import { IconElement } from '@src/types/react';
import { cn } from '@src/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Displays a button or a component that looks like a button.
 *
 * https://ui.shadcn.com/docs/components/button
 */

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, type = 'button', ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
ButtonBase.displayName = 'Button';

export interface ButtonIconProps extends React.SVGAttributes<SVGElement> {
  icon: IconElement;
}

const ButtonIcon = ({
  className,
  icon: Icon,
  ...props
}: ButtonIconProps): JSX.Element => (
  <Icon className={cn('h-4 w-4', className)} {...props} />
);

export interface ButtonWithIconProps extends ButtonProps {
  icon: IconElement;
  iconPosition?: 'left' | 'right';
}

const ButtonWithIcon = React.forwardRef<HTMLButtonElement, ButtonWithIconProps>(
  ({ children, icon, iconPosition = 'left', ...rest }, ref) => {
    return (
      <Button ref={ref} {...rest}>
        {iconPosition === 'left' && <ButtonIcon icon={icon} />}
        {children}
        {iconPosition === 'right' && <ButtonIcon icon={icon} />}
      </Button>
    );
  },
);

ButtonWithIcon.displayName = 'ButtonWithIcon';

interface ButtonWithOnlyIconProps extends ButtonProps {
  icon: IconElement;
  title: string;
  iconClassName?: string;
}

const ButtonWithOnlyIcon = React.forwardRef<
  HTMLButtonElement,
  ButtonWithOnlyIconProps
>(({ icon, title, iconClassName, ...rest }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      aria-label={title}
      title={title}
      {...rest}
    >
      <ButtonIcon className={iconClassName} icon={icon} />
    </Button>
  );
});

ButtonWithOnlyIcon.displayName = 'ButtonWithOnlyIcon';

export const Button = Object.assign(ButtonBase, {
  Icon: ButtonIcon,
  WithIcon: ButtonWithIcon,
  WithOnlyIcon: ButtonWithOnlyIcon,
});
