import {
  ProjectDefinition,
  projectDefinitionSchema,
} from '@halfdomelabs/project-builder-lib';
import { Button, Card, InputField } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = projectDefinitionSchema.pick({
  name: true,
  portOffset: true,
});

type FormData = z.infer<typeof schema>;

interface NewProjectCardProps {
  existingProject?: ProjectDefinition;
  saveProject: (data: FormData) => void;
}

export function NewProjectCard({
  existingProject,
  saveProject,
}: NewProjectCardProps): JSX.Element {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      name: existingProject?.name,
      portOffset: existingProject?.portOffset ?? 3000,
    },
    resolver: zodResolver(schema),
  });

  return (
    <Card className="animate-fade-in-and-grow w-80 sm:w-[30rem]">
      <Card.Content className="flex flex-col space-y-4">
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
        <form
          onSubmit={handleSubmit(saveProject)}
          className="flex flex-col space-y-4"
        >
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
          <Button className="mx-auto" type="submit">
            Initialize Project
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
