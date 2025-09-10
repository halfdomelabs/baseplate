import type {
  AdminCrudColumnDefinition,
  AdminCrudColumnInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAdminCrudColumnSchema,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudColumnWebSpec,
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

import { BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS } from './columns/index.js';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: AdminCrudColumnInput;
  modelRef: string;
  isNew?: boolean;
  onSave: (column: AdminCrudColumnDefinition) => void;
}

export function ColumnDialog({
  open,
  onOpenChange,
  column,
  modelRef,
  isNew = false,
  onSave,
}: Props): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const columnSchema = useDefinitionSchema(createAdminCrudColumnSchema);

  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;

  const columnWeb = pluginContainer.getPluginSpec(adminCrudColumnWebSpec);

  const columnTypeOptions = columnWeb
    .getColumnWebConfigs(BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS)
    .filter(
      (config) => modelRef && config.isAvailableForModel(definition, modelRef),
    )
    .map((config) => ({
      label: config.label,
      value: config.name,
    }));

  const form = useForm({
    resolver: zodResolver(columnSchema),
    values: column ?? {
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
    if (open && !column) {
      reset({
        type: 'text',
        label: '',
      });
    }
  }, [open, column, reset]);

  const columnType = useWatch({ control, name: 'type' });

  const columnWebConfig = columnType
    ? columnWeb.getColumnWebConfig(
        columnType,
        BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS,
      )
    : undefined;

  const WebForm = columnWebConfig?.Form;

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange(false);
  });

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Column' : 'Edit Column'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Configure the new table column settings.'
                : 'Update the column settings below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <SelectFieldController
              label="Type"
              control={control}
              options={columnTypeOptions}
              name="type"
            />
            <InputFieldController
              label="Label"
              control={control}
              name="label"
              placeholder="Enter column label"
            />
            {/* Render column-specific configuration */}
            {WebForm && model && (
              <WebForm
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                formProps={form as any}
                model={model}
                pluginKey={columnWebConfig.pluginKey}
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
              {isNew ? 'Add' : 'Update'} Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
