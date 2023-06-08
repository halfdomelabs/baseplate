import { clsx } from 'clsx';

interface FormLabelProps {
  /**
   * Additional class names to apply to the label
   */
  className?: string;
  /**
   * The label to show
   */
  children: React.ReactNode;
}

/**
 * Shows a label for a form field
 */
export function FormLabel({
  className,
  children,
}: FormLabelProps): JSX.Element {
  return (
    <div
      className={clsx(
        'mb-2 text-sm font-semibold text-foreground-900 dark:text-foreground-300',
        className
      )}
    >
      {children}
    </div>
  );
}
