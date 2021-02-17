import React from 'react';
import classNames from 'classnames';

interface Props {
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  color?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export const Button: React.FC<Props> = ({
  onClick,
  type,
  children,
  className,
  color,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={classNames(
        'button',
        {
          'is-primary': color === 'primary',
          'is-secondary': color === 'secondary',
          'is-danger': color === 'danger',
        },
        className
      )}
    >
      {children}
    </button>
  );
};
