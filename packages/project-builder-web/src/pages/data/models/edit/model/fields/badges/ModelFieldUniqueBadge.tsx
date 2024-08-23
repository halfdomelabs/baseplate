import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { MdStar } from 'react-icons/md';

interface ModelFieldUniqueBadgeProps {
  className?: string;
}

export function ModelFieldUniqueBadge({
  className,
}: ModelFieldUniqueBadgeProps): JSX.Element {
  return (
    <Badge.WithIcon icon={MdStar} className={clsx('', className)}>
      Unique
    </Badge.WithIcon>
  );
}
