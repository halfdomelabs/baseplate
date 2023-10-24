import {
  projectConfigSchema,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { Button, Card, TextInput } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useFieldArray } from 'react-hook-form';
import { MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';

const validationSchema = projectConfigSchema.pick({
  features: true,
});

type FormData = z.infer<typeof validationSchema>;

export function FeaturesHomePage(): JSX.Element {
  const { config, setConfigAndFixReferences } = useProjectConfig();
  const { handleSubmit, control } = useResettableForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: _.pick(config, ['features']),
  });
  const toast = useToast();

  const onSubmit = (data: FormData): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.features = _.sortBy(data.features, (f) => f.name);
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      logError(err);
      toast.error(formatError(err));
    }
  };

  const { fields, remove, append } = useFieldArray({
    control,
    name: 'features',
  });

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <h1>Features</h1>
      <p>
        Features are various functionality that you can add to your application
        to make it more useful. For example, you can add{' '}
        <Link to="auth">authentication</Link> or{' '}
        <Link to="storage">uploads</Link> to your application.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="flex flex-col items-start space-y-4 p-4">
          <h2>Hierarchy</h2>
          <p className="instruction-text">
            Features are organized in a hierarchy. The structure of the features
            in the list below is the way the folder structure will be created in
            your backend/admin applications.
          </p>
          {fields.map((field, idx) => {
            const { id } = field;
            return (
              <div key={id} className="flex flex-row space-x-4">
                <TextInput.Controller
                  control={control}
                  name={`features.${idx}.name`}
                />
                <Button
                  variant="ghost"
                  onClick={() => remove(idx)}
                  title="Delete Feature"
                  size="icon"
                >
                  <Button.Icon icon={MdDelete} />
                </Button>
              </div>
            );
          })}
          <Button
            onClick={() => append({ uid: randomUid(), name: '' })}
            variant="secondary"
          >
            Add Feature
          </Button>
          <Button type="submit">Save</Button>
        </Card>
      </form>
    </div>
  );
}
