// @ts-nocheck
import classNames from 'classnames';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

// adapted from https://flowbite.com/docs/components/button-group/

function ButtonGroup({ className, children }: Props): JSX.Element {
  return (
    <div
      className={classNames('inline-flex rounded-md shadow-sm', className)}
      role="group"
    >
      {children}
    </div>
  );
}

interface ButtonGroupButtonProps {
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

ButtonGroup.Button = function ButtonGroupButton({
  className,
  children,
  type,
  onClick,
}: ButtonGroupButtonProps): JSX.Element {
  return (
    <button
      className={classNames(
        'border-t border-b border-gray-200 bg-white py-2 px-4 text-sm font-medium text-gray-900 first:rounded-l-lg first:border last:rounded-r-lg last:border hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:text-blue-700 focus:ring-2 focus:ring-blue-700 ',
        className
      )}
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default ButtonGroup;
