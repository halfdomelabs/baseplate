import { projectConfigSchema } from '@baseplate/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, TextInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

const validationSchema = projectConfigSchema.pick({
  name: true,
  version: true,
  portBase: true,
  features: true,
});

type FormData = z.infer<typeof validationSchema>;

function GeneralPage(): JSX.Element {
  const { config, setConfigAndFixReferences } = useProjectConfig();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useResettableForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: _.pick(config, ['name', 'version', 'portBase', 'features']),
  });
  const { status, setError } = useStatus();
  const toast = useToast();

  const onSubmit = (data: FormData): void => {
    try {
      setConfigAndFixReferences((oldConfig) => {
        oldConfig.name = data.name;
        oldConfig.version = data.version;
        oldConfig.portBase = data.portBase;
        oldConfig.features = _.sortBy(data.features, (f) => f.name);
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    }
  };

  const { fields, remove, append } = useFieldArray({
    control,
    name: 'features',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1>General Settings</h1>
      <Alert.WithStatus status={status} />
      <TextInput.Labelled
        label="Name (e.g. my-app)"
        register={register('name')}
        error={errors.name?.message}
      />
      <TextInput.Labelled
        label="Version"
        register={register('version')}
        error={errors.version?.message}
      />
      <TextInput.Labelled
        label="Port Base (e.g. 4000)"
        register={register('portBase')}
        error={errors.portBase?.message}
      />
      <h2>Features</h2>
      {fields.map((field, idx) => {
        const { id } = field;
        return (
          <div key={id} className="flex flex-row space-x-4">
            <TextInput.Labelled
              register={register(`features.${idx}.name`)}
              error={errors.features?.[idx]?.name?.message}
            />
            <Button color="light" onClick={() => remove(idx)}>
              Remove
            </Button>
          </div>
        );
      })}
      <div>
        <Button onClick={() => append({ name: '' })}>Add Feature</Button>
      </div>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export default GeneralPage;
