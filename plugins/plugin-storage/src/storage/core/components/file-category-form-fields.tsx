import type { Lens } from '@hookform/lenses';

import {
  InputFieldController,
  MultiComboboxFieldController,
  SelectFieldController,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';

import type { FileCategoryInput } from '../schema/plugin-definition.js';

interface FileCategoryFormFieldsProps {
  lens: Lens<FileCategoryInput>;
  roleOptions: { label: string; value: string }[];
  adapterOptions: { label: string; value: string }[];
}

export function FileCategoryFormFields({
  lens,
  roleOptions,
  adapterOptions,
}: FileCategoryFormFieldsProps): React.JSX.Element {
  return (
    <div className="storage:space-y-4">
      <InputFieldController
        {...lens.focus('name').interop()}
        label="Category Name"
        placeholder="e.g., USER_PROFILE_AVATAR"
        description="Must be CONSTANT_CASE format"
      />
      <InputFieldController
        {...lens.focus('maxFileSizeMb').interop()}
        label="Max File Size (MB)"
        type="number"
        placeholder="e.g., 10"
        description="Maximum file size in megabytes"
        registerOptions={{
          valueAsNumber: true,
        }}
      />
      <MultiComboboxFieldController
        {...lens.focus('authorize.uploadRoles').interop()}
        label="Upload Roles"
        options={roleOptions}
        placeholder="Select roles that can upload..."
        description="User roles authorized to upload files"
      />
      <SelectFieldController
        {...lens.focus('adapterRef').interop()}
        label="Storage Adapter"
        options={adapterOptions}
        placeholder="Select storage adapter..."
        description="Where files will be stored"
      />
      <SwitchFieldController
        {...lens.focus('disableAutoCleanup').interop()}
        label="Disable Auto-Cleanup"
        description="When enabled, files in this category will not be automatically cleaned up"
      />
    </div>
  );
}
