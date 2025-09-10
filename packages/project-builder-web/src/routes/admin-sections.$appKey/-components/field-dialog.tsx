import type {
  AdminCrudInputDefinition,
  AdminCrudInputInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAdminCrudInputSchema,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudInputWebSpec,
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS } from './inputs/index.js';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: AdminCrudInputInput;
  modelRef: string;
  embeddedFormOptions: { label: string; value: string }[];
  isNew?: boolean;
  onSave: (field: AdminCrudInputDefinition) => void;
}

export function FieldDialog({
  open,
  onOpenChange,
  field,
  modelRef,
  embeddedFormOptions,
  isNew = false,
  onSave,
}: Props): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const fieldSchema = useDefinitionSchema(createAdminCrudInputSchema);

  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;

  const inputWeb = pluginContainer.getPluginSpec(adminCrudInputWebSpec);

  const fieldTypeOptions = inputWeb
    .getInputWebConfigs(BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS)
    .map((config) => ({
      label: config.label,
      value: config.name,
    }));

  const form = useForm({
    resolver: zodResolver(fieldSchema),
    values: field ?? {
      type: 'text',
      label: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = form;

  useEffect(() => {
    if (open && !field) {
      reset({
        type: 'text',
        label: '',
      });
    }
  }, [open, field, reset]);

  const fieldType = useWatch({ control, name: 'type' });

  const inputWebConfig = fieldType
    ? inputWeb.getInputWebConfig(
        fieldType,
        BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS,
      )
    : undefined;

  const WebForm = inputWebConfig?.Form;

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange(false);
  });

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Field' : 'Edit Field'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Configure the new form field settings.'
                : 'Update the field settings below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <SelectFieldController
              label="Type"
              control={control}
              options={fieldTypeOptions}
              name="type"
            />
            <InputFieldController
              label="Label"
              control={control}
              name="label"
              placeholder="Enter field label"
            />
            {/* Render field-specific configuration */}
            {WebForm && model && (
              <WebForm
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                formProps={form as any}
                name=""
                model={model}
                embeddedFormOptions={embeddedFormOptions}
                pluginKey={inputWebConfig.pluginKey}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button form={formId} type="submit" disabled={!isDirty}>
              {isNew ? 'Add' : 'Update'} Field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
