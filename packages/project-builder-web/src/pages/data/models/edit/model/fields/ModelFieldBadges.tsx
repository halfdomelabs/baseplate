import { clsx } from 'clsx';

interface ModelFieldBadgesProps {
  className?: string;
}

export function ModelFieldBadges({
  className,
}: ModelFieldBadgesProps): JSX.Element {
  return <div className={clsx('', className)}>contents</div>;
}
