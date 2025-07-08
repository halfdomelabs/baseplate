import type { AppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  appEntityType,
  baseAppSchema,
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

interface NewAppDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function NewAppDialog({
  children,
  open,
  onOpenChange,
}: NewAppDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(baseAppSchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'backend' as const,
    },
  });

  const appTypeOptions = [
    { label: 'Backend App', value: 'backend' },
    { label: 'Web App', value: 'web' },
    { label: 'Admin App', value: 'admin' },
  ];

  const onSubmit = handleSubmit((data) => {
    const newId = appEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (draftConfig) => {
        const newApps = [
          ...draftConfig.apps,
          {
            ...data,
            id: newId,
          },
        ];
        draftConfig.apps = sortBy(newApps, [(app) => app.name]) as AppConfig[];
      },
      {
        successMessage: `Successfully created ${data.name}!`,
        onSuccess: () => {
          setIsOpen(false);
          reset();
          navigate({
            to: `/apps/edit/${appEntityType.keyFromId(newId)}`,
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
          <DialogTitle>Create New App</DialogTitle>
          <DialogDescription>
            Create a new application in your project. Choose the type that best
            fits your needs.
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
            placeholder="e.g. backend, web, admin"
            description="The name of the app, such as 'backend' or 'web'"
            autoComplete="off"
          />
          <SelectFieldController
            label="Type"
            control={control}
            name="type"
            options={appTypeOptions}
            description="Backend apps provide APIs, web apps are client applications, and admin apps manage data"
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
              {isSavingDefinition ? 'Creating...' : 'Create App'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewAppDialog;
