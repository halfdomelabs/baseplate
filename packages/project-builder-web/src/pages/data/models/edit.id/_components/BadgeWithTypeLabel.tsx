import type React from 'react';

import { clsx } from 'clsx';

import { ellipsisStringFromMiddle } from '@src/utils/string';

interface BadgeWithTypeLabelProps {
  className?: string;
  children: React.ReactNode;
  type: string;
}

export function BadgeWithTypeLabel({
  className,
  children,
  type,
}: BadgeWithTypeLabelProps): React.JSX.Element {
  return (
    <div
      className={clsx(
        'flex w-full justify-between gap-4 rounded-md border bg-muted px-2 py-1',
        className,
      )}
    >
      <div>{children}</div>
      <div className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
        {ellipsisStringFromMiddle(type, 20)}
      </div>
    </div>
  );
}
