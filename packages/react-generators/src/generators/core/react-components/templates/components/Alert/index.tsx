// @ts-nocheck

import clsx from 'clsx';

import type { Status, StatusType } from '../../hooks/useStatus.js';

import AlertIcon from '../AlertIcon/index.js';

interface Props {
  type: StatusType;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function getAlertClasses(type: StatusType): string {
  switch (type) {
    case 'error': {
      return 'text-red-700 bg-red-100 dark:bg-red-200 dark:text-red-800';
    }
    case 'info': {
      return 'text-blue-700 bg-blue-100 dark:bg-blue-200 dark:text-blue-800';
    }
    case 'success': {
      return 'text-green-700 bg-green-100 dark:bg-green-200 dark:text-green-800';
    }
    case 'warning': {
      return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-200 dark:text-yellow-800';
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown status type: ${type}`);
    }
  }
}

// https://flowbite.com/docs/components/alerts/

function Alert({ type, icon, className, children }: Props): JSX.Element {
  const alertClasses = getAlertClasses(type);
  return (
    <div
      className={clsx(
        'flex items-center rounded-lg p-4',
        alertClasses,
        className,
      )}
      role="alert"
    >
      {icon === undefined ? <AlertIcon className="mr-2" type={type} /> : icon}
      <div>{children}</div>
    </div>
  );
}

interface AlertWithStatusProps extends Omit<Props, 'children' | 'type'> {
  status: Status | null;
}

Alert.WithStatus = function AlertWithStatus({
  status,
  ...props
}: AlertWithStatusProps): JSX.Element | null {
  if (!status) {
    return null;
  }
  return (
    <Alert type={status.type} {...props}>
      {status.message}
    </Alert>
  );
};

export default Alert;
