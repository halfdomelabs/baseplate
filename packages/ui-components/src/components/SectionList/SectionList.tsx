import type React from 'react';

import { cn } from '@src/utils';

interface SectionListProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Represents a list of sections.
 */
function SectionList({
  className,
  children,
}: SectionListProps): React.ReactElement {
  return <div className={cn('divide-y', className)}>{children}</div>;
}

interface SectionProps {
  className?: string;
  children: React.ReactNode;
}

function SectionListSection({
  className,
  children,
}: SectionProps): React.ReactElement {
  return (
    <section className={cn('flex gap-8 py-6', className)}>{children}</section>
  );
}

interface SectionHeaderProps {
  className?: string;
  children: React.ReactNode;
}

function SectionListSectionHeader({
  className,
  children,
}: SectionHeaderProps): React.ReactElement {
  return <div className={cn('w-[320px] space-y-2', className)}>{children}</div>;
}

interface SectionTitleProps {
  className?: string;
  children: React.ReactNode;
}

function SectionListSectionTitle({
  className,
  children,
}: SectionTitleProps): React.ReactElement {
  return <h3 className={className}>{children}</h3>;
}

interface SectionDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function SectionListSectionDescription({
  className,
  children,
}: SectionDescriptionProps): React.ReactElement {
  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </div>
  );
}

interface SectionContentProps {
  className?: string;
  children: React.ReactNode;
}

function SectionListSectionContent({
  className,
  children,
}: SectionContentProps): React.ReactElement {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

export {
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
};
