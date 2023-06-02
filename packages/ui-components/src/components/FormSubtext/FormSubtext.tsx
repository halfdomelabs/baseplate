import { clsx } from 'clsx';

interface FromSubtextProps {
  /**
   * Additional class names to apply to the error message
   */
  className?: string;
  /**
   * Subtext instructions to show
   */
  children: React.ReactNode;
}

/**
 * Shows subtext instructions for a form field
 */
export function FormSubtext({
  className,
  children,
}: FromSubtextProps): JSX.Element {
  return <div className={clsx('subtext mt-2', className)}>{children}</div>;
}
