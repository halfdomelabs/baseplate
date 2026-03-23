import type { TransformerConfig } from '@baseplate-dev/project-builder-lib';
import type { ModelTransformerWebConfig } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import {
  createTransformerSchema,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useDefinitionSchema } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  DialogClose,
  DialogFooter,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useOriginalModel } from '../../../-hooks/use-original-model.js';

interface ServiceTransformerFormProps {
  className?: string;
  webConfig: ModelTransformerWebConfig;
  transformer?: TransformerConfig;
  onUpdate: (transformer: TransformerConfig) => void;
  isCreate: boolean;
}

export function ServiceTransformerForm({
  className,
  webConfig,
  transformer,
  onUpdate,
  isCreate,
}: ServiceTransformerFormProps): React.JSX.Element | null {
  const originalModel = useOriginalModel();

  // Full form mode: delegate entirely to the Form component
  if (webConfig.Form) {
    const { Form } = webConfig;
    return (
      <Form
        transformer={transformer}
        onUpdate={onUpdate}
        isCreate={isCreate}
        originalModel={originalModel}
        pluginKey={webConfig.pluginKey}
      />
    );
  }

  // FormFields mode: wrap fields in a form with dialog footer
  return (
    <ServiceTransformerFormFields
      className={className}
      webConfig={webConfig}
      transformer={transformer}
      onUpdate={onUpdate}
      isCreate={isCreate}
      originalModel={originalModel}
    />
  );
}

function ServiceTransformerFormFields({
  className,
  webConfig: { FormFields, pluginKey },
  transformer,
  onUpdate,
  isCreate,
  originalModel,
}: ServiceTransformerFormProps & {
  originalModel: ReturnType<typeof useOriginalModel>;
}): React.JSX.Element | null {
  const transformerSchema = useDefinitionSchema(createTransformerSchema);
  const schema = useMemo(
    () =>
      z.object({
        transformer: transformerSchema,
      }),
    [transformerSchema],
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

  if (!FormFields) {
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
      <FormFields
        formProps={formProps}
        name="transformer"
        originalModel={originalModel}
        pluginKey={pluginKey}
      />
      <DialogFooter>
        <DialogClose render={<Button variant="secondary" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={!isCreate && !isDirty} form={formId}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
