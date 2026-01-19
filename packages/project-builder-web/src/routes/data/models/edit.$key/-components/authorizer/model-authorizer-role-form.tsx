import type { AuthorizerRoleConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAuthorizerRoleSchema,
  modelAuthorizerRoleEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useDefinitionSchema } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  DialogClose,
  DialogFooter,
  InputFieldController,
  TextareaFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface ModelAuthorizerRoleFormProps {
  className?: string;
  defaultValues?: AuthorizerRoleConfig;
  onSubmit: (role: AuthorizerRoleConfig) => void;
  onCancel: () => void;
}

export function ModelAuthorizerRoleForm({
  className,
  defaultValues,
  onSubmit,
  onCancel,
}: ModelAuthorizerRoleFormProps): React.JSX.Element {
  const roleSchema = useDefinitionSchema(createAuthorizerRoleSchema);

  const schema = useMemo(
    () =>
      z.object({
        role: roleSchema,
      }),
    [roleSchema],
  );

  const formProps = useForm<{ role: AuthorizerRoleConfig }>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: defaultValues ?? {
        id: modelAuthorizerRoleEntityType.generateNewId(),
        name: '',
        expression: '',
      },
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isDirty },
  } = formProps;

  const isCreate = !defaultValues;

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      ...data.role,
      id: data.role.id || modelAuthorizerRoleEntityType.generateNewId(),
    });
  });

  const formId = useId();

  return (
    <form
      className={clsx('space-y-4', className)}
      id={formId}
      onSubmit={(e) => {
        e.stopPropagation();
        return handleFormSubmit(e);
      }}
    >
      <InputFieldController
        control={control}
        name="role.name"
        label="Role Name"
        placeholder="owner"
        description='A camelCase identifier for this role (e.g., "owner", "viewer")'
      />
      <TextareaFieldController
        control={control}
        name="role.expression"
        label="Expression"
        placeholder="model.id === auth.userId"
        rows={4}
        className="font-mono text-sm"
        description={
          <>
            TypeScript boolean expression. Available: <code>model</code> (the
            model instance) and <code>auth</code> (userId, hasRole, etc.)
          </>
        }
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!isCreate && !isDirty} form={formId}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
