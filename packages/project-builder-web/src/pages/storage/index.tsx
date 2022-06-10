import { StorageConfig, storageSchema } from '@baseplate/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import AdapterEditorForm from './AdapterEditorForm';
import CategoryEditorForm from './CategoryEditorForm';

function StoragePage(): JSX.Element {
  const { config, parsedProject, setConfig, setConfigAndFixReferences } =
    useProjectConfig();

  const formProps = useForm<StorageConfig>({
    resolver: zodResolver(storageSchema),
    defaultValues: config.storage,
  });
  const { control, reset, handleSubmit } = formProps;
  const toast = useToast();
  const { status, setError } = useStatus();

  const onSubmit = (data: StorageConfig): void => {
    try {
      setConfigAndFixReferences((oldConfig) => {
        oldConfig.storage = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    }
  };

  const [isStorageEnabled, setIsStorageEnabled] = useState(!!config.storage);

  const disableStorage = (): void => {
    setConfig((newConfig) => {
      newConfig.storage = undefined;
    });
    reset({});
    setIsStorageEnabled(false);
  };

  const modelOptions = parsedProject.getModels().map((m) => ({
    label: m.name,
    value: m.name,
  }));

  const featureOptions =
    config.features?.map((m) => ({
      label: m.name,
      value: m.name,
    })) || [];

  return (
    <div className="space-y-4">
      <h2>Storage Configuration</h2>
      <Alert.WithStatus status={status} />
      {!isStorageEnabled ? (
        <Button onClick={() => setIsStorageEnabled(true)}>
          Enable Storage
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Button onClick={disableStorage}>Disable Storage</Button>
          <ReactSelectInput.LabelledController
            label="File Model"
            options={modelOptions}
            name="fileModel"
            control={control}
          />
          <ReactSelectInput.LabelledController
            label="Storage Feature Path"
            options={featureOptions}
            name="featurePath"
            control={control}
          />
          <AdapterEditorForm control={control} />
          <CategoryEditorForm control={control} />
          <Button type="submit">Save</Button>
        </form>
      )}
    </div>
  );
}

export default StoragePage;
