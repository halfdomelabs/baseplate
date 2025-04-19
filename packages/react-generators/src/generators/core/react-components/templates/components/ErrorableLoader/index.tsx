// @ts-nocheck

import Alert from '../Alert/index.js';
import Spinner from '../Spinner/index.js';

interface Props {
  className?: string;
  error?: Error | string | null;
}

function getErrorString(error: Error | string): string {
  if (error instanceof Error) {
    return 'Sorry, we could not load the data.';
  }
  return error;
}

function ErrorableLoader({ className, error }: Props): JSX.Element {
  if (!error) {
    return <Spinner className={className} size="large" center />;
  }
  return (
    <Alert type="error" className={className}>
      {getErrorString(error)}
    </Alert>
  );
}

export default ErrorableLoader;
