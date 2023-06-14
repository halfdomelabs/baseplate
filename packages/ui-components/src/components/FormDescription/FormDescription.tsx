import { clsx } from 'clsx';

interface FormDescriptionProps {
  /**
   * Additional class names to apply to the error message
   */
  className?: string;
  /**
   * Description to show
   */
  children: React.ReactNode;
}

/**
 * Shows description for a form field
 */
export function FormDescription({
  className,
  children,
}: FormDescriptionProps): JSX.Element {
  return <div className={clsx('description-text', className)}>{children}</div>;
}
