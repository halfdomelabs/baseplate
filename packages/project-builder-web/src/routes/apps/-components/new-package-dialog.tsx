import type { PackageConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  basePackageSchema,
  packageEntityType,
} from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
  SelectFieldController,
  useControlledState,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useForm } from 'react-hook-form';

import { logAndFormatError } from '#src/services/error-formatter.js';

interface NewPackageDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function NewPackageDialog({
  children,
  open,
  onOpenChange,
}: NewPackageDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(basePackageSchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'node-library' as const,
    },
  });

  const packageTypeOptions = [{ label: 'Node Library', value: 'node-library' }];

  const onSubmit = handleSubmit((data) => {
    const newId = packageEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (draftConfig) => {
        const newPackages = [
          ...draftConfig.packages,
          {
            ...data,
            id: newId,
          },
        ];
        draftConfig.packages = sortBy(newPackages, [
          (pkg) => pkg.name,
        ]) as PackageConfig[];
      },
      {
        successMessage: `Successfully created ${data.name}!`,
        onSuccess: () => {
          setIsOpen(false);
          reset();
          navigate({
            to: `/apps/packages/$key`,
            params: { key: packageEntityType.keyFromId(newId) },
          }).catch(logAndFormatError);
        },
      },
    );
  });

  const handleOpenChange = (newOpen: boolean): void => {
    setIsOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Package</DialogTitle>
          <DialogDescription>
            Create a new library package in your project. Library packages are
            shared code that can be used by apps.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
          className="space-y-4"
        >
          <InputFieldController
            label="Name"
            control={control}
            name="name"
            placeholder="e.g. shared-utils, common"
            description="The name of the package in kebab-case"
            autoComplete="off"
          />
          <SelectFieldController
            label="Type"
            control={control}
            name="type"
            options={packageTypeOptions}
            description="The type of library package to create"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingDefinition}>
              {isSavingDefinition ? 'Creating...' : 'Create Package'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewPackageDialog;
