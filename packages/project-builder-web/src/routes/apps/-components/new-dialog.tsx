import type {
  AppConfig,
  BaseLibraryDefinition,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  appEntityType,
  baseAppSchema,
  baseLibrarySchema,
  libraryEntityType,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useControlledState,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { sortBy, startCase } from 'es-toolkit';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { logAndFormatError } from '#src/services/error-formatter.js';

type TabValue = 'app' | 'package';

interface NewDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: TabValue;
}

export function NewDialog({
  children,
  open,
  onOpenChange,
  defaultTab = 'app',
}: NewDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  const { saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const router = useRouter();

  // App form
  const appForm = useForm({
    resolver: zodResolver(baseAppSchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'backend' as const,
    },
  });

  // Package form
  const packageForm = useForm({
    resolver: zodResolver(baseLibrarySchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'node-library' as const,
    },
  });

  const appTypeOptions = [
    { label: 'Backend App', value: 'backend' },
    { label: 'Web App', value: 'web' },
  ];

  const packageTypeOptions = [{ label: 'Node Library', value: 'node-library' }];

  const onSubmitApp = appForm.handleSubmit((data) => {
    const newId = appEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (draftConfig) => {
        const newApps = [
          ...draftConfig.apps,
          {
            ...data,
            id: newId,
            ...(data.type === 'web' && {
              title: startCase(data.name),
              description: `A ${data.type} application`,
            }),
          },
        ];
        draftConfig.apps = sortBy(newApps, [(app) => app.name]) as AppConfig[];
      },
      {
        successMessage: `Successfully created ${data.name}!`,
        onSuccess: () => {
          handleOpenChange(false);
          router
            .invalidate()
            .then(() => {
              navigate({
                to: `/apps/edit/${appEntityType.keyFromId(newId)}`,
              });
            })
            .catch(logAndFormatError);
        },
      },
    );
  });

  const onSubmitPackage = packageForm.handleSubmit((data) => {
    const newId = libraryEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (draftConfig) => {
        const newLibraries = [
          ...draftConfig.libraries,
          {
            ...data,
            id: newId,
          },
        ];
        draftConfig.libraries = sortBy(newLibraries, [
          (lib) => lib.name,
        ]) as BaseLibraryDefinition[];
      },
      {
        successMessage: `Successfully created ${data.name}!`,
        onSuccess: () => {
          handleOpenChange(false);
          router
            .invalidate()
            .then(() => {
              navigate({
                to: `/apps/packages/$key`,
                params: { key: libraryEntityType.keyFromId(newId) },
              });
            })
            .catch(logAndFormatError);
        },
      },
    );
  });

  const handleOpenChange = (newOpen: boolean): void => {
    setIsOpen(newOpen);
    if (!newOpen) {
      appForm.reset();
      packageForm.reset();
      setActiveTab(defaultTab);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>
            Add a new app or package to your project.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as TabValue);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="app">App</TabsTrigger>
            <TabsTrigger value="package">Package</TabsTrigger>
          </TabsList>

          <TabsContent value="app">
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                return onSubmitApp(e);
              }}
              className="space-y-4"
            >
              <InputFieldController
                label="Name"
                control={appForm.control}
                name="name"
                placeholder="e.g. backend, web, admin"
                description="The name of the app, such as 'backend' or 'web'"
                autoComplete="off"
              />
              <SelectFieldController
                label="Type"
                control={appForm.control}
                name="type"
                options={appTypeOptions}
                description="Backend apps provide APIs, web apps are client applications"
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
          </TabsContent>

          <TabsContent value="package">
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                return onSubmitPackage(e);
              }}
              className="space-y-4"
            >
              <InputFieldController
                label="Name"
                control={packageForm.control}
                name="name"
                placeholder="e.g. shared-utils, common"
                description="The name of the package in kebab-case"
                autoComplete="off"
              />
              <SelectFieldController
                label="Type"
                control={packageForm.control}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
