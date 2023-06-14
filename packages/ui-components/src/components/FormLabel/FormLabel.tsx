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
  /**
   * The `htmlFor` attribute to apply to the label
   */
  htmlFor?: string;
}

/**
 * Shows a label for a form field
 */
export function FormLabel({
  className,
  children,
  htmlFor,
}: FormLabelProps): JSX.Element {
  return (
    <label className={clsx('label-text', className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}
