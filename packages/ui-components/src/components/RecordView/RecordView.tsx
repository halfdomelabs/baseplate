import type React from 'react';

import { cn } from '@src/utils';

interface RecordViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function RecordView({
  className,
  children,
}: RecordViewProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border bg-muted p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface RecordViewItemListProps {
  className?: string;
  children: React.ReactNode;
}

RecordView.ItemList = function RecordViewItemList({
  className,
  children,
}: RecordViewItemListProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {children}
    </div>
  );
};

interface RecordViewItemProps {
  className?: string;
  title: React.ReactNode;
  children: React.ReactNode;
}

RecordView.Item = function RecordViewItem({
  className,
  title,
  children,
}: RecordViewItemProps): React.JSX.Element {
  return (
    <div className={cn('flex min-w-24 flex-col', className)}>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
};

interface RecordViewActionsProps {
  className?: string;
  children: React.ReactNode;
}

RecordView.Actions = function RecordViewActions({
  className,
  children,
}: RecordViewActionsProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  );
};
