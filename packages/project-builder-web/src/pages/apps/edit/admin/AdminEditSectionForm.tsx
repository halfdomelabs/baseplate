import {
  AdminAppConfig,
  AdminSectionConfig,
  adminSectionSchema,
  randomUid,
} from '@baseplate/project-builder-lib';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LinkButton, SelectInput, TextInput } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import AdminCrudSectionForm from './crud/AdminCrudSectionForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

const SECTION_OPTIONS = [{ label: 'Crud', value: 'crud' }];

function AdminEditSectionForm({ className, appConfig }: Props): JSX.Element {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { setConfigAndFixReferences, parsedProject } = useProjectConfig();
  const toast = useToast();
  const navigate = useNavigate();

  const existingSection =
    sectionId &&
    appConfig.sections?.find((section) => section.uid === sectionId);

  const { control, handleSubmit, watch, formState, reset } =
    useForm<AdminSectionConfig>({
      defaultValues: existingSection || { type: 'crud' },
      resolver: zodResolver(adminSectionSchema),
    });

  useEffect(() => {
    reset(existingSection || { type: 'crud' });
  }, [reset, existingSection]);

  // TODO: Remove
  if (Object.keys(formState.errors).length) {
    console.log(formState.errors);
  }

  const type = watch('type');

  function handleDelete(): void {
    try {
      if (!window.confirm(`Are you sure you want to delete this section?`)) {
        return;
      }
      setConfigAndFixReferences((config) => {
        const adminApp = config.apps.find((app) => app.uid === appConfig.uid);
        if (adminApp?.type !== 'admin') {
          throw new Error('Cannot add a section to a non-admin app');
        }

        adminApp.sections = (adminApp.sections || []).filter(
          (section) => !sectionId || section.uid !== sectionId
        );
      });
      navigate(`..`);
      toast.success('Successfully deleted section!');
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  function onSubmit(data: AdminSectionConfig): void {
    try {
      const uid = data.uid || randomUid();
      setConfigAndFixReferences((config) => {
        const adminApp = config.apps.find((app) => app.uid === appConfig.uid);
        if (adminApp?.type !== 'admin') {
          throw new Error('Cannot add a section to a non-admin app');
        }

        adminApp.sections = _.sortBy(
          [
            ...(adminApp.sections || []).filter(
              (section) => !sectionId || section.uid !== sectionId
            ),
            { ...data, uid },
          ],
          'name'
        );
      });
      if (!sectionId) {
        navigate(`edit/${uid}`);
      }
      toast.success('Successfully saved section!');
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  const featureOptions = parsedProject.projectConfig.features.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  return (
    <div className={classNames('', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {sectionId && (
          <LinkButton onClick={() => handleDelete()}>Delete Section</LinkButton>
        )}
        <TextInput.LabelledController
          label="Name"
          control={control}
          name="name"
        />
        <ReactSelectInput.LabelledController
          label="Feature"
          control={control}
          options={featureOptions}
          name="feature"
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
