import type {
  AdminCrudActionDefinition,
  AdminCrudActionInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
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
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { BUILT_IN_ADMIN_CRUD_ACTION_WEB_CONFIGS } from './actions/index.js';

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

  const actionWeb = pluginContainer.getPluginSpec(adminCrudActionWebSpec);

  const actionTypeOptions = actionWeb
    .getActionWebConfigs(BUILT_IN_ADMIN_CRUD_ACTION_WEB_CONFIGS)
    .filter(
      (config) => modelRef && config.isAvailableForModel(definition, modelRef),
    )
    .map((config) => ({
      label: config.label,
      value: config.name,
    }));

  const form = useForm({
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
  } = form;

  const actionType = useWatch({ control, name: 'type' });

  const actionWebConfig = actionType
    ? actionWeb.getActionWebConfig(
        actionType,
        BUILT_IN_ADMIN_CRUD_ACTION_WEB_CONFIGS,
      )
    : undefined;

  const WebForm = actionWebConfig?.Form;

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
