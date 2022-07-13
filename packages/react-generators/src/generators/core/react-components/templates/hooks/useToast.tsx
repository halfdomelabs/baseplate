// @ts-nocheck

import React, { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { AlertIcon, Toast } from 'COMPONENT_FOLDER';

interface UseToastResult {
  error: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export function useToast(): UseToastResult {
  const showToast = useCallback(
    (message: string, icon?: React.ReactElement): void => {
      toast.custom((t) => (
        <Toast
          visible={t.visible}
          icon={icon}
          onClose={() => toast.dismiss(t.id)}
        >
          {message}
        </Toast>
      ));
    },
    []
  );

  return useMemo(
    () => ({
      error: (message: string) => {
        showToast(message, <AlertIcon type="error" />);
      },
      success: (message: string) => {
        showToast(message, <AlertIcon type="success" />);
      },
      warning: (message: string) => {
        showToast(message, <AlertIcon type="warning" />);
      },
      info: (message: string) => {
        showToast(message, <AlertIcon type="info" />);
      },
    }),
    [showToast]
  );
}
