import { ProjectConfig } from '@halfdomelabs/project-builder-lib';
import { Button, Card, TextInput } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/i,
      'A project name should be all lowercase letters, numbers, and dashes, e.g. my-project'
    ),
  portOffset: z
    .number()
    .min(1000)
    .max(60000)
    .int()
    .refine(
      (portOffset) => portOffset % 1000 === 0,
      'Port offset must be a multiple of 1000, e.g. 1000, 2000, 3000, etc.'
    ),
});

type FormData = z.infer<typeof schema>;

interface NewProjectCardProps {
  existingProject?: ProjectConfig;
  saveProject: (data: FormData) => void;
}

export function NewProjectCard({
  existingProject,
  saveProject,
}: NewProjectCardProps): JSX.Element {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      name: existingProject?.name,
      portOffset: existingProject?.portOffset || 3000,
    },
    resolver: zodResolver(schema),
  });

  return (
    <Card className="animate-fade-in-and-grow w-[20rem] sm:w-[30rem]">
      <Card.Body className="flex flex-col space-y-4">
        <img
          className="mx-auto w-16"
          src="/images/logo.png"
          alt="Baseplate Logo"
        />
        <div className="space-y-2">
          <h1 className="text-center">Welcome to Baseplate</h1>
          <p className="subheading text-center">Let&apos;s get you set up!</p>
        </div>
        <form
          onSubmit={handleSubmit(saveProject)}
          className="flex flex-col space-y-4"
        >
          <TextInput.LabelledController
            name="name"
            label="Project Name"
            subtext="Lowercase letters and dashes, e.g. my-project"
            control={control}
            placeholder="e.g. my-project"
          />
          <TextInput.LabelledController
            name="portOffset"
            label="Port Offset"
            subtext="Multiple of 1000, e.g. 4000. This will offset the ports used by the project, e.g. API at 4001, database at 4432, to avoid conflicts with other projects."
            control={control}
            registerOptions={{ valueAsNumber: true }}
          />
          <Button className="mx-auto" type="submit">
            Initialize Project
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
}
