import { FeatureFlag } from '@halfdomelabs/project-builder-lib';
import React from 'react';

export interface UseClientVersionResult {
  version: string;
  refreshVersion: () => Promise<void>;
  featureFlags: FeatureFlag[];
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
