import React from 'react';

export interface UseClientVersionResult {
  version: string;
  refreshVersion: () => Promise<void>;
}

export const ClientVersionContext =
  React.createContext<UseClientVersionResult | null>(null);

export function useClientVersion(): UseClientVersionResult {
  const result = React.useContext(ClientVersionContext);
  if (!result) {
    throw new Error(
      `useClientVersion must be used within a <ClientVersionContext.Provider>`,
    );
  }
  return result;
}
