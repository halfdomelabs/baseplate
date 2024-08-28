import { cn } from '@src/utils';

interface SectionListProps {
  className?: string;
  children: React.ReactNode;
}

export function SectionList({
  className,
  children,
}: SectionListProps): JSX.Element {
  return <div className={cn('divide-y', className)}>{children}</div>;
}

interface SectionListSectionProps {
  className?: string;
  children: React.ReactNode;
}

SectionList.Section = function SectionListSection({
  className,
  children,
}: SectionListSectionProps): JSX.Element {
  return (
    <section className={cn('flex gap-8 py-6', className)}>{children}</section>
  );
};

interface SectionListSectionHeaderProps {
  className?: string;
  children: React.ReactNode;
}

SectionList.SectionHeader = function SectionListSectionHeader({
  className,
  children,
}: SectionListSectionHeaderProps): JSX.Element {
  return <div className={cn('w-[320px] space-y-2', className)}>{children}</div>;
};

interface SectionListSectionTitleProps {
  className?: string;
  children: React.ReactNode;
}

SectionList.SectionTitle = function SectionListSectionTitle({
  className,
  children,
}: SectionListSectionTitleProps): JSX.Element {
  return <h3 className={className}>{children}</h3>;
};

interface SectionListSectionDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

SectionList.SectionDescription = function SectionListSectionDescription({
  className,
  children,
}: SectionListSectionDescriptionProps): JSX.Element {
  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </div>
  );
};

interface SectionListSectionContentProps {
  className?: string;
  children: React.ReactNode;
}

SectionList.SectionContent = function SectionListSectionContent({
  className,
  children,
}: SectionListSectionContentProps): JSX.Element {
  return <div className={cn('flex-1', className)}>{children}</div>;
};
