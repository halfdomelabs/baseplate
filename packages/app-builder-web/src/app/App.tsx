import { AppConfig } from '@baseplate/app-builder-lib';
import { useEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useImmer } from 'use-immer';
import { AppConfigContext } from 'src/hooks/useAppConfig';
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
        return JSON.parse(savedConfig) as AppConfig;
      } catch (err) {
        toast.error(`Could not parse stored config: ${formatError(err)}`);
      }
    }
    return {
      name: 'test-app',
      version: '0.1.0',
      portBase: 4000,
      apps: {
        backend: null,
      },
    };
  }, [savedConfig, toast]);

  const [config, setConfig] = useImmer<AppConfig>(initialConfig);
  const result = useMemo(
    () => ({
      config,
      setConfig,
    }),
    [config, setConfig]
  );

  useEffect(() => {
    setSavedConfig(JSON.stringify(config));
  }, [config, setSavedConfig]);

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
