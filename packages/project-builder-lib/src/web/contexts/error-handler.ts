import { createContext } from 'react';

export interface ErrorHandlerValue {
  formatError: (error: unknown) => string;
  logError: (error: unknown) => void;
  logAndFormatError: (error: unknown) => string;
}

export const ErrorHandlerContext = createContext<ErrorHandlerValue | null>(
  null,
);
