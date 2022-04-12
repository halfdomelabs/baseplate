import {
  AppConfig,
  appConfigSchema,
  APP_CONFIG_REFERENCEABLES,
  APP_CONFIG_REFERENCES,
  fixReferenceRenames,
  ParsedAppConfig,
} from '@baseplate/app-builder-lib';
import produce from 'immer';
import { useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { AppConfigContext, UseAppConfigResult } from 'src/hooks/useAppConfig';
import { useLocalStorage } from 'src/hooks/useLocalStorage';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import PagesRoot from '../pages';

function App(): JSX.Element {
  const [savedConfig, setSavedConfig] = useLocalStorage('saved-app-config');
  const toast = useToast();
  const initialConfig = useMemo(() => {
    if (savedConfig) {
      try {
        const appConfig = JSON.parse(savedConfig) as AppConfig;
        // validate config
        const validatedConfig = appConfigSchema.validateSync(appConfig);
        return new ParsedAppConfig(validatedConfig);
      } catch (err) {
        toast.error(`Could not parse stored config: ${formatError(err)}`);
      }
    }
    return new ParsedAppConfig({
      name: 'test-app',
      version: '0.1.0',
      portBase: 4000,
      apps: {
        backend: null,
      },
    });
  }, [savedConfig, toast]);

  const [parsedApp, setParsedApp] = useState<ParsedAppConfig>(initialConfig);

  const result: UseAppConfigResult = useMemo(
    () => ({
      config: parsedApp.exportToAppConfig(),
      parsedApp,
      setConfigAndFixReferences: (transformer, options) => {
        // validate app config
        // TODO: Figure out better validation technique
        // get new app config
        const oldAppConfig = parsedApp.exportToAppConfig();
        const newAppConfig = produce(oldAppConfig, transformer);
        const fixedAppConfig = fixReferenceRenames(
          oldAppConfig,
          newAppConfig,
          APP_CONFIG_REFERENCEABLES,
          APP_CONFIG_REFERENCES,
          options
        );
        const validatedAppConfig = appConfigSchema.validateSync(
          fixedAppConfig,
          {
            stripUnknown: true,
          }
        );
        const parsedConfig = new ParsedAppConfig(validatedAppConfig);
        setParsedApp(parsedConfig);
        const exportedAppConfig = parsedConfig.exportToAppConfig();
        setSavedConfig(JSON.stringify(exportedAppConfig));
      },
      setConfig: (newConfig) => {
        // validate app config
        // TODO: Figure out better validation technique
        // get new app config
        const oldAppConfig = parsedApp.exportToAppConfig();
        const newAppConfig =
          typeof newConfig === 'function'
            ? produce(oldAppConfig, newConfig)
            : newConfig;
        const validatedAppConfig = appConfigSchema.validateSync(newAppConfig, {
          stripUnknown: true,
        });
        const parsedConfig = new ParsedAppConfig(validatedAppConfig);
        setParsedApp(parsedConfig);
        const exportedAppConfig = parsedConfig.exportToAppConfig();
        setSavedConfig(JSON.stringify(exportedAppConfig));
      },
    }),
    [parsedApp, setSavedConfig]
  );

  return (
    <BrowserRouter>
      <AppConfigContext.Provider value={result}>
        <PagesRoot />
        <Toaster />
      </AppConfigContext.Provider>
    </BrowserRouter>
  );
}

export default App;
