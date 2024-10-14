import clsx from 'clsx';
import { IconType } from 'react-icons';
import {
  MdCheckCircleOutline,
  MdErrorOutline,
  MdOutlineInfo,
  MdOutlineWarningAmber,
} from 'react-icons/md';
import { StatusType } from '../../hooks/useStatus';

interface Props {
  className?: string;
  type: StatusType;
}

function getAlertClassAndIcon(type: StatusType): {
  colorClasses: string;
  Icon: IconType;
} {
  switch (type) {
    case 'error':
      return {
        colorClasses:
          'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200',
        Icon: MdErrorOutline,
      };
    case 'info':
      return {
        colorClasses:
          'text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200',
        Icon: MdOutlineInfo,
      };
    case 'success':
      return {
        colorClasses:
          'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200',
        Icon: MdCheckCircleOutline,
      };
    case 'warning':
      return {
        colorClasses: 'text-orange-500 bg-orange-100 dark:bg-orange-700',
        Icon: MdOutlineWarningAmber,
      };
    default:
      throw new Error(`Unknown status type: ${type as string}`);
  }
}

function AlertIcon({ className, type }: Props): JSX.Element {
  const { colorClasses, Icon } = getAlertClassAndIcon(type);

  return (
    <div
      className={clsx(
        'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
        colorClasses,
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default AlertIcon;
