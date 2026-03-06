import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { createContext, useContext } from 'react';

const OriginalModelContext = createContext<ModelConfig | undefined>(undefined);

export function OriginalModelProvider({
  model,
  children,
}: {
  model: ModelConfig;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <OriginalModelContext.Provider value={model}>
      {children}
    </OriginalModelContext.Provider>
  );
}

export function useOriginalModel(): ModelConfig {
  const model = useContext(OriginalModelContext);
  if (!model) {
    throw new Error(
      'useOriginalModel must be used within an OriginalModelProvider',
    );
  }
  return model;
}
