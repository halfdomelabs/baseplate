import { Badge } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { MdKey } from 'react-icons/md';

interface ModelFieldPrimaryBadgeProps {
  className?: string;
}

export function ModelFieldPrimaryBadge({
  className,
}: ModelFieldPrimaryBadgeProps): JSX.Element {
  return (
    <Badge.WithIcon icon={MdKey} className={clsx('', className)}>
      Primary
    </Badge.WithIcon>
  );
}
