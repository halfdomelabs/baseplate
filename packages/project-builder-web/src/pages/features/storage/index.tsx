import {
  StorageConfig,
  storageSchema,
} from '@halfdomelabs/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import AdapterEditorForm from './AdapterEditorForm';
import CategoryEditorForm from './CategoryEditorForm';
import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { Alert, Button } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';

function StoragePage(): JSX.Element {
  const { config, parsedProject, setConfig, setConfigAndFixReferences } =
    useProjectConfig();

  const formProps = useResettableForm<StorageConfig>({
    resolver: zodResolver(storageSchema),
    defaultValues: config.storage,
  });
  const { control, reset, handleSubmit, formState } = formProps;
  const toast = useToast();
  const { status, setError } = useStatus();

  useBlockDirtyFormNavigate(formState);

  const onSubmit = (data: StorageConfig): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.storage = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      logError(err);
      setError(formatError(err));
    }
  };

  const [isStorageEnabled, setIsStorageEnabled] = useState(!!config.storage);

  const disableStorage = (): void => {
    setConfig((draftConfig) => {
      draftConfig.storage = undefined;
    });
    reset({});
    setIsStorageEnabled(false);
  };

  const modelOptions = parsedProject.getModels().map((m) => ({
    label: m.name,
    value: m.id,
  }));

  const featureOptions =
    config.features?.map((m) => ({
      label: m.name,
      value: m.id,
    })) ?? [];

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
