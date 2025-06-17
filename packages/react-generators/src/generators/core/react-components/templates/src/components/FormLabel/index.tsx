// @ts-nocheck

import type { ReactElement } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function FormLabel({ className, children }: Props): ReactElement {
  return (
    <div
      className={clsx(
        'mb-2 text-sm font-semibold text-gray-900 dark:text-gray-300',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default FormLabel;
