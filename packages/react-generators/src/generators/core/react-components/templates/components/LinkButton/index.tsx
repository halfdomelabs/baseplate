// @ts-nocheck
import classNames from 'classnames';
import React from 'react';

interface Props {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler;
  type?: 'button' | 'submit' | 'reset';
  negative?: boolean;
}

function LinkButton({
  className,
  children,
  onClick,
  type = 'button',
  negative,
}: Props): JSX.Element {
  const colorClass = (() => {
    if (negative) {
      return 'text-red-600 dark:text-red-500';
    }
    return 'text-blue-600 dark:text-blue-500';
  })();

  return (
    <button
      className={classNames(
        'hover:underline font-medium',
        colorClass,
        className
      )}
      // a type is being provided but eslint doesn't know
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default LinkButton;
