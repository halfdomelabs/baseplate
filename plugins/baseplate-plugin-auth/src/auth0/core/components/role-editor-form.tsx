import type React from 'react';
import type { Control } from 'react-hook-form';

import { authRoleEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Badge,
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import type { AuthRoleInput } from '#src/roles/index.js';

import type { Auth0PluginDefinitionInput } from '../schema/plugin-definition.js';

import { RoleDialog } from './role-dialog.js';

interface Props {
  className?: string;
  control: Control<Auth0PluginDefinitionInput>;
}

function RoleEditorForm({ className, control }: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 'roles',
  });
  const [roleToEdit, setRoleToEdit] = useState<AuthRoleInput | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  const roles = useWatch({ control, name: 'roles' });

  function handleSaveRole(newRole: AuthRoleInput): void {
    const existingIndex = roles.findIndex((role) => role.id === newRole.id);
    if (existingIndex === -1) {
      append(newRole);
    } else {
      update(existingIndex, newRole);
    }
  }

  function handleDeleteRole(roleIdx: number): void {
    const role = roles[roleIdx];
    requestConfirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete the role "${role.name}"?`,
      onConfirm: () => {
        remove(roleIdx);
      },
    });
  }

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>User Roles</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define roles for your application. Default roles are protected and
          cannot be removed.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="auth:space-y-4">
        {roles.map((role, roleIdx) => (
          <RecordView key={role.id}>
            <RecordViewItemList>
              <RecordViewItem title="Name">
                <div className="auth:flex auth:items-center auth:gap-2">
                  <span>{role.name}</span>
                </div>
              </RecordViewItem>
              <RecordViewItem title="Description">
                {role.comment.trim() || (
                  <span className="auth:text-muted-foreground">
                    No description
                  </span>
                )}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              {role.builtIn && <Badge variant="secondary">Default Role</Badge>}
              {!role.builtIn && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => {
                      setRoleToEdit(role);
                      setIsEditing(true);
                    }}
                  >
                    <MdEdit />
                  </Button>
                  <Button
                    variant="ghostDestructive"
                    size="icon"
                    title="Delete"
                    onClick={() => {
                      handleDeleteRole(roleIdx);
                    }}
                  >
                    <MdDeleteOutline />
                  </Button>
                </>
              )}
            </RecordViewActions>
          </RecordView>
        ))}
        <RoleDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          role={roleToEdit}
          onSave={handleSaveRole}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setRoleToEdit({
              id: authRoleEntityType.generateNewId(),
              name: '',
              comment: '',
              builtIn: false,
            });
            setIsEditing(true);
          }}
        >
          <MdAdd />
          Add Role
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default RoleEditorForm;
