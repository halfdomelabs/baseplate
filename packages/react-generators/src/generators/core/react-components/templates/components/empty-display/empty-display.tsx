// @ts-nocheck

'use client';

import type React from 'react';

import { MdFormatListBulleted } from 'react-icons/md';

import type { IconElement } from '../../types/icon.js';

import { cn } from '../../utils/cn.js';

interface EmptyDisplayProps {
  /**
   * Optional class name to be applied to the empty state div
   */
  className?: string;
  /**
   * Optional icon to be displayed (if not passed, a generic empty state icon will be displayed)
   */
  icon?: IconElement;
  /**
   * Header to be displayed (if not passed, a generic empty header will be displayed)
   */
  header?: React.ReactNode;
  /**
   * Subtitle to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic empty message will be displayed)
   */
  subtitle?: React.ReactNode;
  /**
   * Optional actions to be displayed below the empty message
   */
  actions?: React.ReactNode;
}

/**
 * Displays a generic empty state with a header and subtitle.
 */
function EmptyDisplay({
  className,
  icon: Icon = MdFormatListBulleted,
  header,
  subtitle,
  actions,
}: EmptyDisplayProps): React.ReactElement {
  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <div className="flex max-w-xl flex-col items-center space-y-4 text-center">
        <div>
          <Icon className="size-20 text-muted-foreground" />
        </div>
        <h1>{header ?? 'No items found'}</h1>
        <p className="text-muted-foreground">
          {subtitle ?? 'There is no content here yet.'}
        </p>
        {actions}
      </div>
    </div>
  );
}

export { EmptyDisplay };
