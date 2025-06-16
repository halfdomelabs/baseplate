// @ts-nocheck

import { useState } from 'react';

export type StatusType = 'error' | 'warning' | 'success' | 'info';

export interface Status {
  type: StatusType;
  message: string;
  code?: string;
}

interface StatusHookResult {
  status: Status | null;
  setStatus: (status: Status | null) => void;
  clearStatus: () => void;
  setError: (message: string, code?: string) => void;
  setWarning: (message: string, code?: string) => void;
  setSuccess: (message: string, code?: string) => void;
  setInfo: (message: string, code?: string) => void;
}

export function useStatus(): StatusHookResult {
  const [status, setStatus] = useState<Status | null>(null);
  return {
    status,
    setStatus,
    clearStatus: () => {
      setStatus(null);
    },
    setError: (message, code) => {
      setStatus({ type: 'error', message, code });
    },
    setWarning: (message, code) => {
      setStatus({ type: 'warning', message, code });
    },
    setSuccess: (message, code) => {
      setStatus({ type: 'success', message, code });
    },
    setInfo: (message, code) => {
      setStatus({ type: 'info', message, code });
    },
  };
}
