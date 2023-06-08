import { clsx } from 'clsx';
import React from 'react';
import { MdFormatListBulleted } from 'react-icons/md';
import { COMPONENT_STRINGS } from '@src/constants/strings.js';
import { IconElement } from '@src/types/react.js';

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
  header?: string;
  /**
   * Subtitle to be displayed (if a string is passed, it will be displayed as-is, otherwise a generic empty message will be displayed)
   */
  subtitle?: React.ReactNode;
  /**
   * Optional actions to be displayed below the empty message
   */
  actions?: React.ReactNode;
}

export function EmptyDisplay({
  className,
  icon: Icon = MdFormatListBulleted,
  header,
  subtitle,
  actions,
}: EmptyDisplayProps): JSX.Element {
  return (
    <div className={clsx('mt-20 flex items-center justify-center', className)}>
      <div className="flex max-w-xl flex-col items-center space-y-4 text-center">
        <div>
          <Icon className="h-20 w-20 text-foreground-300 dark:text-foreground-700" />
        </div>
        <h1>{header || COMPONENT_STRINGS.genericEmptyHeader}</h1>
        <p className="text-base">
          {subtitle || COMPONENT_STRINGS.genericEmptyContent}
        </p>
        {actions}
      </div>
    </div>
  );
}
