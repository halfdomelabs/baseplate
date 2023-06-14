import { clsx } from 'clsx';

interface FormErrorProps {
  /**
   * Additional class names to apply to the error message.
   */
  className?: string;
  /**
   * The error message to show.
   */
  children: React.ReactNode;
}

/**
 * Shows an error message for a form field.
 */
export function FormError({
  className,
  children,
}: FormErrorProps): JSX.Element {
  return (
    <div
      className={clsx(
        'animate-in text-xs text-red-600 dark:text-red-700',
        className
      )}
    >
      {children}
    </div>
  );
}
