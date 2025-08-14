import type { AdminCrudTableColumnDefinition } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  adminCrudDisplayTypes,
  createAdminCrudTableColumnSchema,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
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
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: AdminCrudTableColumnDefinition;
  modelRef: string;
  isNew?: boolean;
  onSave: (column: AdminCrudTableColumnDefinition) => void;
}

export function ColumnDialog({
  open,
  onOpenChange,
  column,
  modelRef,
  isNew = false,
  onSave,
}: Props): React.JSX.Element {
  const { definition, definitionContainer } = useProjectDefinition();
  const columnSchema = useDefinitionSchema(createAdminCrudTableColumnSchema);

  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;

  const form = useForm({
    resolver: zodResolver(columnSchema),
    values: column ?? {
      label: '',
      display: {
        type: 'text' as const,
        modelFieldRef: '',
      },
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const displayType = useWatch({ control, name: 'display.type' });

  const localRelationOptions =
    model?.model.relations?.map((relation) => ({
      label: `${relation.name} (${definitionContainer.nameFromId(relation.modelRef)})`,
      value: relation.id,
    })) ?? [];

  const fieldOptions =
    model?.model.fields.map((field) => ({
      label: field.name,
      value: field.id,
    })) ?? [];

  const displayTypeOptions = adminCrudDisplayTypes.map((t) => ({
    label: t,
    value: t,
  }));

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
              options={displayTypeOptions}
              name="display.type"
            />
            <InputFieldController
              label="Label"
              control={control}
              name="label"
              placeholder="Enter column label"
            />

            {displayType === 'text' && (
              <SelectFieldController
                label="Field"
                control={control}
                name="display.modelFieldRef"
                options={fieldOptions}
              />
            )}
            {displayType === 'foreign' && (
              <>
                <SelectFieldController
                  label="Local Relation Name"
                  control={control}
                  name="display.localRelationRef"
                  options={localRelationOptions}
                />
                <InputFieldController
                  label="Label Expression (e.g. name)"
                  control={control}
                  name="display.labelExpression"
                  placeholder="name"
                />
                <InputFieldController
                  label="Value Expression (e.g. id)"
                  control={control}
                  name="display.valueExpression"
                  placeholder="id"
                />
              </>
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
