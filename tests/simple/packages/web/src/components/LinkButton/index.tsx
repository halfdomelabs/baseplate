import type React from 'react';
import type { ReactElement } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler;
  type?: 'button' | 'submit' | 'reset';
  negative?: boolean;
  disabled?: boolean;
}

function LinkButton({
  className,
  children,
  onClick,
  type = 'button',
  negative,
  disabled,
}: Props): ReactElement {
  const colorClass = (() => {
    if (disabled) {
      return 'text-gray-400 dark:text-gray-500';
    }
    if (negative) {
      return 'text-red-600 dark:text-red-500';
    }
    return 'text-blue-600 dark:text-blue-500';
  })();

  return (
    <button
      className={clsx(
        'font-medium',
        { 'hover:underline': !disabled },
        colorClass,
        className,
      )}
      // a type is being provided but eslint doesn't know

      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default LinkButton;
