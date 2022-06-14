import {
  AdminAppConfig,
  AdminSectionConfig,
  adminSectionSchema,
} from '@baseplate/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Button, SelectInput, TextInput } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import AdminCrudSectionForm from './crud/AdminCrudSectionForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

const SECTION_OPTIONS = [{ label: 'Crud', value: 'crud' }];

function AdminEditSectionForm({ className, appConfig }: Props): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { setConfigAndFixReferences } = useProjectConfig();

  const existingSection =
    id && appConfig.sections?.find((section) => section.uid === id);

  const { control, handleSubmit, watch } = useForm<AdminSectionConfig>({
    defaultValues: existingSection || { type: 'crud' },
    resolver: zodResolver(adminSectionSchema),
  });

  const type = watch('type');

  function onSubmit(data: AdminSectionConfig): void {
    setConfigAndFixReferences((config) => {
      const adminApp = config.apps.find((app) => app.uid === appConfig.uid);
      if (adminApp?.type !== 'admin') {
        throw new Error('Cannot add a section to a non-admin app');
      }

      adminApp.sections = _.sortBy(
        [
          ...(adminApp.sections || []).filter(
            (section) => !id || section.uid !== id
          ),
          data,
        ],
        'name'
      );
    });
  }

  return (
    <div className={classNames('', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <SelectInput.LabelledController
          label="Type"
          control={control}
          name="type"
          options={SECTION_OPTIONS}
        />
        {(() => {
          switch (type) {
            case 'crud':
              return <AdminCrudSectionForm control={control} />;
            default:
              return <div>Unsupported type {type}</div>;
          }
        })()}
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}

export default AdminEditSectionForm;
