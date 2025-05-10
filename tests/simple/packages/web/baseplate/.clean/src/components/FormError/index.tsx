import type { ReactElement } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
  children: React.ReactNode;
}

function FormError({ className, children }: Props): ReactElement {
  return (
    <div
      className={clsx('mt-2 text-sm text-red-600 dark:text-red-500', className)}
    >
      {children}
    </div>
  );
}

export default FormError;
