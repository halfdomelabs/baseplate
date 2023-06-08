import { clsx } from 'clsx';
import { ComponentPropsWithoutRef, ElementType } from 'react';
import { IconElement } from '@src/types/react.js';

interface NavigationLinkProps<T extends ElementType> {
  className?: string;
  icon?: IconElement;
  children?: React.ReactNode;
  isActive?: boolean;
  as?: T;
}

export function NavigationLink<T extends ElementType = 'a'>({
  className,
  icon: Icon,
  children,
  isActive = true,
  as,
  ...rest
}: ComponentPropsWithoutRef<T> & NavigationLinkProps<T>): JSX.Element {
  const As = as || 'a';
  return (
    <As
      className={clsx(
        'inline-flex items-center space-x-2 rounded px-2.5 py-2',
        'border-secondary-300 bg-black bg-opacity-0 text-foreground-700 hover:bg-opacity-5 hover:text-foreground-700 active:text-foreground-900',
        'dark:border-secondary-700 dark:bg-white dark:bg-opacity-0 dark:text-foreground-200 dark:hover:bg-opacity-10 dark:active:text-foreground-400',
        className
      )}
      {...rest}
    >
      {Icon && (
        <Icon className="h-4 w-4 text-secondary-400 dark:text-secondary-600" />
      )}
      {children && (
        <div className={isActive ? 'font-semibold' : 'font-normal'}>
          {children}
        </div>
      )}
    </As>
  );
}
