import type {
  AuthorizerRoleConfig,
  ModelConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
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
} from '@baseplate-dev/ui-components';
import { useFieldArray } from 'react-hook-form';
import { MdAdd, MdEdit, MdOutlineDelete } from 'react-icons/md';

import { ModelAuthorizerRoleDialog } from './model-authorizer-role-dialog.js';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfigInput>;
}

function AuthorizerRoleRecord({
  role,
  idx,
  onUpdate,
  onRemove,
}: {
  role: AuthorizerRoleConfig;
  idx: number;
  onUpdate: (role: AuthorizerRoleConfig, idx: number) => void;
  onRemove: (idx: number) => void;
}): React.JSX.Element {
  return (
    <RecordView>
      <RecordViewItemList>
        <RecordViewItem title="Role Name">{role.name}</RecordViewItem>
        <RecordViewItem title="Expression">
          <code className="font-mono text-sm">{role.expression}</code>
        </RecordViewItem>
      </RecordViewItemList>
      <RecordViewActions>
        <ModelAuthorizerRoleDialog
          role={role}
          onSave={(updatedRole) => {
            onUpdate(updatedRole, idx);
          }}
          asChild
        >
          <Button variant="ghost" size="icon" title="Edit">
            <MdEdit />
          </Button>
        </ModelAuthorizerRoleDialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onRemove(idx);
          }}
          title="Remove"
          className="text-destructive hover:text-destructive-hover"
        >
          <MdOutlineDelete />
        </Button>
      </RecordViewActions>
    </RecordView>
  );
}

export function ModelAuthorizerRolesSection({
  className,
  formProps,
}: Props): React.JSX.Element {
  const { control } = formProps;
  const { fields, remove, append, update } = useFieldArray({
    control,
    name: 'authorizer.roles',
  });

  const { requestConfirm } = useConfirmDialog();

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Authorization Roles</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define roles for controlling access to this model. Roles can be
          referenced by service methods and GraphQL operations.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="max-w-xl space-y-4">
        {fields.map((field, idx) => (
          <AuthorizerRoleRecord
            key={field.id}
            role={field}
            idx={idx}
            onUpdate={(role, idx) => {
              update(idx, role);
            }}
            onRemove={(idx) => {
              requestConfirm({
                title: 'Confirm delete',
                content: 'Are you sure you want to delete this role?',
                buttonConfirmText: 'Delete',
                buttonConfirmVariant: 'destructive',
                onConfirm: () => {
                  remove(idx);
                },
              });
            }}
          />
        ))}
        <ModelAuthorizerRoleDialog
          onSave={(newRole) => {
            append(newRole);
          }}
          asChild
        >
          <Button variant="secondary" size="sm">
            <MdAdd />
            Add Role
          </Button>
        </ModelAuthorizerRoleDialog>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
