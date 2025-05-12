import type { ProjectDefinition } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { z } from 'zod';

import { projectDefinitionSchema } from '@halfdomelabs/project-builder-lib';
import { Button, Card, InputField, toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { logAndFormatError } from '@src/services/error-formatter';

const schema = projectDefinitionSchema.pick({
  name: true,
  portOffset: true,
});

type FormData = z.infer<typeof schema>;

interface NewProjectCardProps {
  existingProject?: ProjectDefinition;
  saveProject: (data: FormData) => Promise<void>;
}

export function NewProjectCard({
  existingProject,
  saveProject,
}: NewProjectCardProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: existingProject?.name,
      portOffset: existingProject?.portOffset ?? 3000,
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    saveProject(data).catch((err: unknown) => {
      toast.error(logAndFormatError(err, 'Failed to save project'));
    });
  });

  return (
    <Card className="animate-in fade-in zoom-in w-80 sm:w-120">
      <Card.Content className="flex flex-col space-y-4">
        <img
          className="mx-auto w-16"
          src="/images/logo.png"
          alt="Baseplate Logo"
        />
        <div className="space-y-2">
          <h1 className="text-center">Welcome to Baseplate</h1>
          <p className="text-style-lead text-center">
            Let&apos;s get you set up!
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col space-y-4">
          <InputField.Controller
            name="name"
            label="Project Name"
            description="Lowercase letters and dashes, e.g. my-project"
            control={control}
            placeholder="e.g. my-project"
          />
          <InputField.Controller
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
      </Card.Content>
    </Card>
  );
}
