import { clsx } from 'clsx';

interface SectionListProps {
  className?: string;
  children: React.ReactNode;
}

export function SectionList({
  className,
  children,
}: SectionListProps): JSX.Element {
  return <div className={clsx('divide-y', className)}>{children}</div>;
}

interface SectionListSectionProps {
  className?: string;
  children: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}

SectionList.Section = function SectionListSection({
  className,
  children,
  title,
  description,
}: SectionListSectionProps): JSX.Element {
  return (
    <section className={clsx('flex gap-8 py-6', className)}>
      <div className="w-[320px] space-y-2">
        <h3>{title}</h3>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
};
