import { ProjectConfig } from '@baseplate/project-builder-lib';
import prettyStringify from 'json-stringify-pretty-compact';
import { useMemo, useState } from 'react';
import sortKeys from 'sort-keys';
import { Button } from 'src/components';
import TextAreaInput from 'src/components/TextAreaInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function HomePage(): JSX.Element {
  const { config, setConfig } = useProjectConfig();
  const initialValue = useMemo(() => {
    const stableConfig = sortKeys(config, {
      deep: true,
    });
    return prettyStringify(stableConfig);
  }, [config]);
  const [value, setValue] = useState(initialValue);
  const toast = useToast();

  const handleImport = (): void => {
    try {
      setConfig(JSON.parse(value) as ProjectConfig);
      toast.success('Successfully imported config!');
    } catch (err) {
      toast.error(`Error importing config: ${formatError(err)}`);
    }
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
                  apps: [],
                  features: [],
                  models: [],
                } as ProjectConfig,
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
        className="h-96 font-mono"
        placeholder="Paste your configuration here"
        value={value}
        onTextChange={(text) => setValue(text)}
      />
    </div>
  );
}

export default HomePage;
