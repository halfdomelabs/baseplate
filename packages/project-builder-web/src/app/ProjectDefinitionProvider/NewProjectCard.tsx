import type {
  GeneralSettingsInput,
  ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { generalSettingsSchema } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Card,
  CardContent,
  InputFieldController,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { logAndFormatError } from '#src/services/error-formatter.js';

interface NewProjectCardProps {
  existingProject?: ProjectDefinition;
  saveProject: (data: GeneralSettingsInput) => Promise<void>;
}

export function NewProjectCard({
  existingProject,
  saveProject,
}: NewProjectCardProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: existingProject?.settings.general,
    resolver: zodResolver(generalSettingsSchema),
  });

  const onSubmit = handleSubmit((data) => {
    saveProject(data).catch((err: unknown) => {
      toast.error(logAndFormatError(err, 'Failed to save project'));
    });
  });

  return (
    <Card className="w-80 animate-in fade-in zoom-in-70 sm:w-120">
      <CardContent className="flex flex-col space-y-4">
        <img
          className="mx-auto w-16"
          src="/images/logo.png"
          alt="Baseplate Logo"
        />
        <div className="space-y-2">
          <h1 className="text-center">Welcome to Baseplate</h1>
          <p className="text-center text-style-lead">
            Let&apos;s get you set up!
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col space-y-4">
          <InputFieldController
            name="name"
            label="Project Name"
            description="Lowercase letters and dashes, e.g. my-project"
            control={control}
            placeholder="e.g. my-project"
          />
          <InputFieldController
            name="portOffset"
            label="Port Offset"
            description="Multiple of 1000, e.g. 4000. This will offset the ports used by the project, e.g. API at 4001, database at 4432, to avoid conflicts with other projects."
            control={control}
            registerOptions={{ valueAsNumber: true }}
          />
          <Button className="mx-auto" type="submit" disabled={isSubmitting}>
            Initialize Project
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
