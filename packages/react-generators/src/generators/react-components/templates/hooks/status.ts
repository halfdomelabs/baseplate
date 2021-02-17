import { useState } from 'react';

export type StatusType = 'error' | 'warning' | 'success' | 'info';

export interface Status {
  type: StatusType;
  message: string;
}

export function useStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  return {
    status,
    setStatus,
    clearStatus: () => setStatus(null),
    setError: (message: string) => setStatus({ type: 'error', message }),
    setWarning: (message: string) => setStatus({ type: 'warning', message }),
    setSuccess: (message: string) => setStatus({ type: 'success', message }),
    setInfo: (message: string) => setStatus({ type: 'info', message }),
  };
}
