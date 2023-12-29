import {
  AuthConfig,
  AUTH_DEFAULT_ROLES,
  randomUid,
  authRoleEntityType,
} from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';

import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';

interface Props {
  className?: string;
  control: Control<AuthConfig>;
}

function RoleEditorForm({ className, control }: Props): JSX.Element {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'roles',
  });

  const roles = useWatch({ control, name: 'roles' });

  const roleOptions =
    roles?.map((role) => ({
      label: role.name,
      value: role.id,
    })) ?? [];

  useEffect(() => {
    // strip any bad inherits
    roles?.forEach((role, idx) => {
      const inherits = role.inherits ?? [];
      const permittedInherits = inherits.filter((inherit) =>
        roles.find((r) => r.name === inherit),
      );
      if (permittedInherits.length !== inherits.length) {
        update(idx, { ...role, inherits: permittedInherits });
      }
    });
  }, [roles, update]);

  const isFixedRole = (name: string): boolean =>
    AUTH_DEFAULT_ROLES.some((role) => role.name === name);

  return (
    <div className={classNames('space-y-4', className)}>
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
          <CheckedArrayInput.LabelledController
            label="Inherits"
            options={roleOptions}
            control={control}
            name={`roles.${idx}.inherits`}
          />
          {!isFixedRole(field.name) && (
            <Button color="light" onClick={() => remove(idx)}>
              Remove
            </Button>
          )}
        </div>
      ))}

      <Button
        onClick={() =>
          append({
            id: authRoleEntityType.generateNewId(),
            uid: randomUid(),
            name: '',
            comment: '',
          })
        }
      >
        Add Role
      </Button>
    </div>
  );
}

export default RoleEditorForm;
