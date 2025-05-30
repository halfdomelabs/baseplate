import type React from 'react';
import type { Control } from 'react-hook-form';

import { authRoleEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputFieldController,
} from '@halfdomelabs/ui-components';
import { useFieldArray } from 'react-hook-form';
import { MdAdd, MdDelete } from 'react-icons/md';

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
    <Card className={className}>
      <CardHeader>
        <div className="auth:flex auth:items-center auth:justify-between">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>
              Define roles for your application. Default roles are protected and
              cannot be removed.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              append({
                id: authRoleEntityType.generateNewId(),
                name: '',
                comment: '',
                builtIn: false,
              });
            }}
          >
            <MdAdd className="auth:mr-2 auth:h-4 auth:w-4" />
            Add Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="auth:space-y-3">
          {fields.map((field, idx) => {
            const isFixed = isFixedRole(field.name);
            return (
              <div
                key={field.id}
                className={cn(
                  'auth:rounded-lg auth:border auth:p-4',
                  isFixed ? 'auth:bg-muted/50' : 'auth:bg-background',
                )}
              >
                <div className="auth:flex auth:items-start auth:gap-4">
                  <div className="auth:flex-1">
                    <div className="auth:grid auth:grid-cols-1 auth:gap-4">
                      <div className="auth:relative">
                        <InputFieldController
                          label="Role Name"
                          disabled={isFixed}
                          control={control}
                          name={`roles.${idx}.name`}
                          placeholder="Enter role name"
                        />
                        {isFixed && (
                          <Badge
                            variant="secondary"
                            className="auth:absolute auth:top-0 auth:right-0"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                      <InputFieldController
                        label="Description"
                        control={control}
                        name={`roles.${idx}.comment`}
                        placeholder="Describe this role's purpose"
                      />
                    </div>
                  </div>
                  {!isFixed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="auth:shrink-0"
                      onClick={() => {
                        remove(idx);
                      }}
                    >
                      <MdDelete className="auth:h-4 auth:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {fields.length === 0 && (
            <div className="auth:py-8 auth:text-center auth:text-muted-foreground">
              No roles defined yet. Click &ldquo;Add Role&rdquo; to create your
              first role.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RoleEditorForm;
