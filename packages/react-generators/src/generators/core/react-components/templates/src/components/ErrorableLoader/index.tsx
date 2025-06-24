// @ts-nocheck

import type { ReactElement } from 'react';

import { Alert } from '../alert/alert.js';
import { Loader } from '../loader/loader.js';

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

function ErrorableLoader({ className, error }: Props): ReactElement {
  if (!error) {
    return <Loader className={className} />;
  }
  return (
    <Alert variant="error" className={className}>
      {getErrorString(error)}
    </Alert>
  );
}

export default ErrorableLoader;
