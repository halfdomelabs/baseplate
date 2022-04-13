import {
  AppConfig,
  FixReferenceRenamesOptions,
  ParsedAppConfig,
} from '@baseplate/project-builder-lib';
import React from 'react';

export interface UseAppConfigResult {
  config: AppConfig;
  parsedApp: ParsedAppConfig;
  setConfigAndFixReferences: (
    transformer: (originalConfig: AppConfig) => void,
    options?: FixReferenceRenamesOptions
  ) => void;
  setConfig: (
    config: AppConfig | ((originalConfig: AppConfig) => void)
  ) => void;
}

export const AppConfigContext = React.createContext<UseAppConfigResult | null>(
  null
);

export function useAppConfig(): UseAppConfigResult {
  const result = React.useContext(AppConfigContext);
  if (!result) {
    throw new Error(`useAppConfig must be used within a <AppConfigProvider>`);
  }
  return result;
}
