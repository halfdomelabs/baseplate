import { AppConfig } from '@baseplate/app-builder-lib';
import { useMemo, useState } from 'react';
import { Button } from 'src/components';
import TextAreaInput from 'src/components/TextAreaInput';
import { useAppConfig } from 'src/hooks/useAppConfig';
import { useToast } from 'src/hooks/useToast';

function HomePage(): JSX.Element {
  const { config, setConfig } = useAppConfig();
  const initialValue = useMemo(
    () => JSON.stringify(config, undefined, 2),
    [config]
  );
  const [value, setValue] = useState(initialValue);
  const toast = useToast();

  const handleImport = (): void => {
    setConfig(JSON.parse(value) as AppConfig);
    toast.success('Successfully imported config!');
  };

  return (
    <div className="space-y-4">
      <h1>Welcome to the Baseplate App Builder!</h1>
      <p>
        This app builder allows you to configure an app using Baseplate quickly
        using the options on the left.
      </p>
      <h2>Import/Export Configuration</h2>
      <div className="flex flex-row space-x-4">
        <Button
          secondary
          onClick={() =>
            setValue(
              JSON.stringify(
                {
                  name: 'test-app',
                  version: '0.1.0',
                  portBase: 4000,
                  apps: {
                    backend: null,
                  },
                },
                undefined,
                2
              )
            )
          }
        >
          Reset
        </Button>
        <Button onClick={handleImport}>Import Config</Button>
      </div>
      <TextAreaInput
        className="h-96"
        placeholder="Paste your configuration here"
        value={value}
        onTextChange={(text) => setValue(text)}
      />
    </div>
  );
}

export default HomePage;
