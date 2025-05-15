import type React from 'react';

import { cn } from '@src/utils';

interface RecordViewProps {
  className?: string;
  children?: React.ReactNode;
}

function RecordView({
  className,
  children,
}: RecordViewProps): React.ReactElement {
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

function RecordViewItemList({
  className,
  children,
}: RecordViewItemListProps): React.ReactElement {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {children}
    </div>
  );
}

interface RecordViewItemProps {
  className?: string;
  title: React.ReactNode;
  children: React.ReactNode;
}

function RecordViewItem({
  className,
  title,
  children,
}: RecordViewItemProps): React.ReactElement {
  return (
    <div className={cn('flex min-w-24 flex-col', className)}>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

interface RecordViewActionsProps {
  className?: string;
  children: React.ReactNode;
}

function RecordViewActions({
  className,
  children,
}: RecordViewActionsProps): React.ReactElement {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  );
}

export { RecordView, RecordViewActions, RecordViewItem, RecordViewItemList };
