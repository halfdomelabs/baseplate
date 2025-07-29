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

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';

interface ServiceTransformerFormProps {
  className?: string;
  webConfig: ModelTransformerWebConfig;
  transformer?: TransformerConfig;
  onUpdate: (transformer: TransformerConfig) => void;
  isCreate: boolean;
}

export function ServiceTransformerForm({
  className,
  webConfig: { Form, pluginKey },
  transformer,
  onUpdate,
  isCreate,
}: ServiceTransformerFormProps): React.JSX.Element | null {
  const originalModel = useEditedModelConfig((model) => model);
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
        pluginKey={pluginKey}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!isCreate && !isDirty} form={formId}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
