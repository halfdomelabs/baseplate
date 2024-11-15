import { useContext } from 'react';

import type { ErrorHandlerValue } from '../contexts/error-handler.js';

import { ErrorHandlerContext } from '../contexts/error-handler.js';

export function useErrorHandler(): ErrorHandlerValue {
  const context = useContext(ErrorHandlerContext);

  if (!context) {
    throw new Error(
      'useErrorHandler must be used within an ErrorHandlerContext',
    );
  }

  return context;
}
