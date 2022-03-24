// @ts-nocheck
import Alert from '../Alert';
import Spinner from '../Spinner';
import { formatError } from 'src/services/error-formatter';

interface Props {
  className?: string;
  error?: Error | string | null;
}

function getErrorString(error: Error | string): string {
  if (error instanceof Error) {
    return formatError(error, 'Sorry, we could not load the data.');
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
