import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';
import type { BaseplateUserConfig } from '@halfdomelabs/project-builder-server';

import React from 'react';

export interface UseClientVersionResult {
  version: string;
  featureFlags: FeatureFlag[];
  userConfig: BaseplateUserConfig;
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
