import { clsx } from 'clsx';
import { MdClose } from 'react-icons/md';
import { IconElement } from '@src/types/react.js';
import { Button } from '../Button/Button.js';

type BadgeColor = 'primary' | 'secondary';

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  icon?: IconElement;
  color?: BadgeColor;
  onClick?: () => void;
  onClose?: () => void;
}

function getBadgeColorClass(color: BadgeColor, isHoverable?: boolean): string {
  return clsx(
    color === 'primary' && 'border-primary-200 bg-primary-100 text-primary-800',
    color === 'primary' && isHoverable && 'hover:bg-primary-200',
    color === 'secondary' &&
      'border-secondary-200 bg-secondary-100 text-secondary-800',
    color === 'secondary' && isHoverable && 'hover:bg-secondary-200'
  );
}

export function Badge({
  className,
  children,
  icon: Icon,
  color = 'secondary',
  onClick,
  onClose,
}: BadgeProps): JSX.Element {
  return (
    <div className={clsx('inline-flex', className)}>
      <button
        className={clsx(
          'flex items-center space-x-1 rounded-l border px-2 py-1 text-xs font-medium',
          onClose ? '' : 'rounded-r',
          getBadgeColorClass(color, !!onClick),
          className
        )}
        disabled={!onClick}
        type="button"
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <div className="overflow-hidden text-ellipsis">{children}</div>
      </button>
      {onClose && (
        <button
          onClick={onClose}
          title="Delete badge"
          className={clsx(
            'rounded-r border border-l-0 p-1',
            getBadgeColorClass(color, true),
            className
          )}
          type="button"
        >
          <MdClose className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
