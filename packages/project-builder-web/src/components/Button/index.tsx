import type React from 'react';

import clsx from 'clsx';

type ButtonColor = 'blue' | 'green' | 'red' | 'light' | 'dark';

type ButtonSize = 'small' | 'base' | 'large';

interface Props {
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  color?: ButtonColor;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
}

function getButtonColorClass(color: ButtonColor): string {
  switch (color) {
    case 'blue': {
      return 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300';
    }
    case 'green': {
      return 'text-white bg-green-700 hover:bg-green-800 focus:ring-green-300';
    }
    case 'red': {
      return 'text-white bg-red-700 hover:bg-red-800 focus:ring-red-300';
    }
    case 'light': {
      return 'text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-gray-200';
    }
    case 'dark': {
      return 'text-white bg-gray-800 hover:bg-gray-900 focus:ring-gray-300';
    }
    default: {
      throw new Error(`Unknown button color: ${color as string}`);
    }
  }
}

function getButtonSizeClass(size: ButtonSize): string {
  switch (size) {
    case 'small': {
      return 'px-3 py-2 text-sm';
    }
    case 'base': {
      return 'px-5 py-2.5 text-sm';
    }
    case 'large': {
      return 'px-5 py-3 text-base';
    }
    default: {
      throw new Error(`Unknown button size: ${size as string}`);
    }
  }
}

function Button(props: Props): React.JSX.Element {
  const {
    className,
    children,
    disabled,
    size = 'base',
    color = 'blue',
    type = 'button',
    onClick,
  } = props;
  return (
    <button
      className={clsx(
        'rounded-lg text-center font-medium focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
        getButtonColorClass(color),
        getButtonSizeClass(size),
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      // a type is being provided but eslint doesn't know

      type={type}
    >
      {children}
    </button>
  );
}

export default Button;
