import type { AuthConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  AUTH_DEFAULT_ROLES,
  authRoleEntityType,
} from '@halfdomelabs/project-builder-lib';
import { Button } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useFieldArray } from 'react-hook-form';
import { TextInput } from 'src/components';

interface Props {
  className?: string;
  control: Control<AuthConfig>;
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
    <div className={clsx('space-y-4', className)}>
      <h3>Roles</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className="space-y-4">
          <TextInput.LabelledController
            label="Name"
            disabled={isFixedRole(field.name)}
            control={control}
            name={`roles.${idx}.name`}
          />
          <TextInput.LabelledController
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
