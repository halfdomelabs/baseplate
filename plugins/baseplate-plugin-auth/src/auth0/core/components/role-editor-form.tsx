import type React from 'react';
import type { Control } from 'react-hook-form';

import { authRoleEntityType } from '@halfdomelabs/project-builder-lib';
import { Button, InputFieldController } from '@halfdomelabs/ui-components';
import { useFieldArray } from 'react-hook-form';

import { AUTH_DEFAULT_ROLES } from '#src/roles/index.js';
import { cn } from '#src/utils/cn.js';

import type { Auth0PluginDefinitionInput } from '../schema/plugin-definition.js';

interface Props {
  className?: string;
  control: Control<Auth0PluginDefinitionInput>;
}

function isFixedRole(name: string): boolean {
  return AUTH_DEFAULT_ROLES.some((role) => role.name === name);
}

function RoleEditorForm({ className, control }: Props): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roles',
  });

  return (
    <div className={cn('auth:space-y-4', className)}>
      <h3>Roles</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className="auth:space-y-4">
          <InputFieldController
            label="Name"
            disabled={isFixedRole(field.name)}
            control={control}
            name={`roles.${idx}.name`}
          />
          <InputFieldController
            label="Comment"
            control={control}
            name={`roles.${idx}.comment`}
          />
          {!isFixedRole(field.name) && (
            <Button
              color="light"
              onClick={() => {
                remove(idx);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      ))}

      <Button
        onClick={() => {
          append({
            id: authRoleEntityType.generateNewId(),
            name: '',
            comment: '',
            builtIn: false,
          });
        }}
      >
        Add Role
      </Button>
    </div>
  );
}

export default RoleEditorForm;
