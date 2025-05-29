import type React from 'react';

import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';

import { ellipsisStringFromMiddle } from '#src/utils/string.js';

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
        'flex h-8 w-full items-center justify-between gap-4 rounded-md border bg-muted px-3 text-sm',
        className,
      )}
    >
      <div>{children}</div>
      <Badge variant="outline" className="text-muted-foreground">
        {ellipsisStringFromMiddle(type, 20)}
      </Badge>
    </div>
  );
}
