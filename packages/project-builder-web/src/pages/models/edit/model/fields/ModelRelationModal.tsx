import { clsx } from 'clsx';

interface ModalRelationsModalProps {
  className?: string;
}

export function ModalRelationsModal({
  className,
}: ModalRelationsModalProps): JSX.Element {
  return <div className={clsx('', className)}>contents</div>;
}
