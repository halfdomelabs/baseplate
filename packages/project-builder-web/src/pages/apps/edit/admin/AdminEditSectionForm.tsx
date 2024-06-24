import {
  AdminAppConfig,
  AdminSectionConfig,
  adminSectionEntityType,
  adminSectionSchema,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useResettableForm } from '@halfdomelabs/project-builder-lib/web';
import { useConfirmDialog } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import _ from 'lodash';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AdminCrudSectionForm from './crud/AdminCrudSectionForm';
import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { Button, LinkButton, SelectInput, TextInput } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

const SECTION_OPTIONS = [{ label: 'Crud', value: 'crud' }];

function AdminEditSectionForm({ className, appConfig }: Props): JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { sectionId: sectionUid } = useParams<{ sectionId: string }>();
  const { setConfigAndFixReferences, parsedProject } = useProjectDefinition();
  const toast = useToast();
  const navigate = useNavigate();

  const sectionId = sectionUid
    ? adminSectionEntityType.fromUid(sectionUid)
    : undefined;

  const existingSection = sectionId
    ? appConfig.sections?.find((section) => section.id === sectionId)
    : undefined;

  const { control, handleSubmit, watch, reset, formState } =
    useResettableForm<AdminSectionConfig>({
      defaultValues: existingSection ?? { type: 'crud' },
      resolver: zodResolver(adminSectionSchema),
    });

  useBlockDirtyFormNavigate(formState);

  useEffect(() => {
    reset(existingSection ?? { type: 'crud' });
  }, [reset, existingSection]);

  const type = watch('type');

  function handleDelete(): void {
    requestConfirm({
      title: 'Delete Section',
      content: `Are you sure you want to delete ${
        existingSection?.name ?? 'this section'
      }?`,
      onConfirm: () => {
        try {
          setConfigAndFixReferences((config) => {
            const adminApp = config.apps.find((app) => app.id === appConfig.id);
            if (adminApp?.type !== 'admin') {
              throw new Error('Cannot add a section to a non-admin app');
            }

            adminApp.sections = (adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            );
          });
          navigate(`..`);
          toast.success('Successfully deleted section!');
        } catch (err) {
          toast.error(formatError(err));
        }
      },
    });
  }

  function onSubmit(data: AdminSectionConfig): void {
    try {
      const id = data.id || adminSectionEntityType.generateNewId();
      setConfigAndFixReferences((config) => {
        const adminApp = config.apps.find((app) => app.id === appConfig.id);
        if (adminApp?.type !== 'admin') {
          throw new Error('Cannot add a section to a non-admin app');
        }

        adminApp.sections = _.sortBy(
          [
            ...(adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            ),
            { ...data, id },
          ],
          'name',
        );
      });
      if (!sectionId) {
        navigate(`edit/${adminSectionEntityType.toUid(id)}`);
      }
      toast.success('Successfully saved section!');
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  const featureOptions = parsedProject.projectDefinition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <div className={clsx('', className)}>
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
        <TextInput.LabelledController
          label="Icon"
          control={control}
          name="icon"
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
