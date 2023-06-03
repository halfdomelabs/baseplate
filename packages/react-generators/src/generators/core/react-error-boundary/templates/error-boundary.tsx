import {
  ErrorBoundary as ReactErrorBoundary,
  FallbackProps,
} from 'react-error-boundary';
import { Button, Card } from '%react-components';
import { logError } from '%react-error/logger';

interface Props {
  children?: React.ReactNode;
}

function ErrorBoundaryFallback({
  resetErrorBoundary,
}: FallbackProps): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <Card padding className="flex flex-col items-center space-y-4">
        <div className="text-xl font-bold">Unexpected Error</div>
        <p className="text-center text-gray-600">
          Sorry, we encountered an error while showing this page. Please try
          again.
        </p>
        <Button onClick={() => resetErrorBoundary()}>Reload Page</Button>
      </Card>
    </div>
  );
}

export function ErrorBoundary({ children }: Props): JSX.Element {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorBoundaryFallback}
      onError={(err) => logError(err)}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
