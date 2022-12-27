import Alert from '../Alert';
import Spinner from '../Spinner';

interface Props {
  className?: string;
  error?: Error | string | null;
}

function getErrorString(error: Error | string): string {
  if (error instanceof Error) {
    return `Sorry, we could not load the data: ${error.message}`;
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
