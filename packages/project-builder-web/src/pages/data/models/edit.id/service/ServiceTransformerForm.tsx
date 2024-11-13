import {
  TransformerConfig,
  modelTransformerEntityType,
  transformerSchema,
} from '@halfdomelabs/project-builder-lib';
import {
  ModelTransformerWebConfig,
  usePluginEnhancedSchema,
} from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useEditedModelConfig } from '../../_hooks/useEditedModelConfig';

interface ServiceTransformerFormProps {
  className?: string;
  webConfig: ModelTransformerWebConfig;
  transformer?: TransformerConfig;
  onUpdate: (transformer: TransformerConfig) => void;
}

export function ServiceTransformerForm({
  className,
  webConfig: { Form, pluginId },
  transformer,
  onUpdate,
}: ServiceTransformerFormProps): JSX.Element | null {
  const originalModel = useEditedModelConfig((model) => model);
  const schema = usePluginEnhancedSchema(
    z.object({
      transformer: transformerSchema,
    }),
  );
  const formProps = useForm<{ transformer: TransformerConfig }>({
    resolver: zodResolver(schema),
    defaultValues: { transformer },
  });
  const {
    handleSubmit,
    formState: { isDirty },
  } = formProps;

  const onSubmit = handleSubmit((data) => {
    onUpdate({
      ...data.transformer,
      id: data.transformer.id
        ? data.transformer.id
        : modelTransformerEntityType.generateNewId(),
    });
  });

  const formId = useId();

  if (!Form) {
    return null;
  }

  return (
    <form
      className={clsx('space-y-4', className)}
      id={formId}
      onSubmit={(e) => {
        e.stopPropagation();
        return onSubmit(e);
      }}
    >
      <Form
        formProps={formProps}
        name="transformer"
        originalModel={originalModel}
        pluginId={pluginId}
      />
      <Dialog.Footer>
        <Dialog.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Button type="submit" disabled={!isDirty} form={formId}>
          Save
        </Button>
      </Dialog.Footer>
    </form>
  );
}
