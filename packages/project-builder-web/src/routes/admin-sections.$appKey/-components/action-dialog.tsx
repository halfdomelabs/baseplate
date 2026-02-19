import type {
  AdminCrudActionDefinition,
  AdminCrudActionInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  adminCrudActionEntityType,
  createAdminCrudActionSchema,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
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
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: AdminCrudActionInput;
  modelRef: string;
  isNew?: boolean;
  onSave: (action: AdminCrudActionDefinition) => void;
}

export function ActionDialog({
  open,
  onOpenChange,
  action,
  modelRef,
  isNew = false,
  onSave,
}: Props): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();
  const actionSchema = useDefinitionSchema(createAdminCrudActionSchema);

  const model = modelRef
    ? ModelUtils.byIdOrThrow(definition, modelRef)
    : undefined;

  const actionWeb = pluginContainer.use(adminCrudActionWebSpec);

  const actionTypeOptions = [...actionWeb.actions.values()]
    .filter(
      (config) => modelRef && config.isAvailableForModel(definition, modelRef),
    )
    .map((config) => ({
      label: config.label,
      value: config.name,
    }));

  const form = useForm<AdminCrudActionInput>({
    resolver: zodResolver(actionSchema),
    values: action ?? {
      type: 'edit',
      position: 'inline' as const,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = form;

  useEffect(() => {
    if (open && !action) {
      reset({
        type: 'edit',
        position: 'inline' as const,
      });
    }
  }, [open, action, reset]);

  const actionType = useWatch({ control, name: 'type' });

  const actionWebConfig = actionType
    ? actionWeb.actions.get(actionType)
    : undefined;

  const WebForm = actionWebConfig?.Form;

  const onSubmit = handleSubmit((data) => {
    onSave({
      ...data,
      id: data.id ?? adminCrudActionEntityType.generateNewId(),
      position: data.position ?? 'dropdown',
    });
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
            <DialogTitle>{isNew ? 'Add Action' : 'Edit Action'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Configure the new table action settings.'
                : 'Update the action settings below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <SelectFieldController
              label="Type"
              control={control}
              options={actionTypeOptions}
              name="type"
            />
            <SelectFieldController
              label="Position"
              control={control}
              options={[
                { label: 'Inline', value: 'inline' },
                { label: 'Dropdown', value: 'dropdown' },
              ]}
              name="position"
            />
            {/* Render action-specific configuration */}
            {WebForm && model && (
              <WebForm
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                formProps={form as any}
                model={model}
                pluginKey={actionWebConfig.pluginKey}
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
              {isNew ? 'Add' : 'Update'} Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
