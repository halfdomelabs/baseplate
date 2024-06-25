import { useContext } from 'react';

import {
  ErrorHandlerContext,
  ErrorHandlerValue,
} from '../contexts/error-handler.js';

export function useErrorHandler(): ErrorHandlerValue {
  const context = useContext(ErrorHandlerContext);

  if (!context) {
    throw new Error(
      'useErrorHandler must be used within an ErrorHandlerContext',
    );
  }

  return context;
}
