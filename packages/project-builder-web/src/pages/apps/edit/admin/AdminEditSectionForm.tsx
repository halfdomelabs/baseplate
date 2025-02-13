import type {
  AdminAppConfig,
  AdminSectionConfig,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  adminSectionEntityType,
  adminSectionSchema,
  zPluginWrapper,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { useConfirmDialog } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, LinkButton, SelectInput, TextInput } from 'src/components';
import ReactSelectInput from 'src/components/ReactSelectInput';

import AdminCrudSectionForm from './crud/AdminCrudSectionForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

const SECTION_OPTIONS = [{ label: 'Crud', value: 'crud' }];

function AdminEditSectionForm({
  className,
  appConfig,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { sectionId: sectionUid } = useParams<{ sectionId: string }>();
  const {
    saveDefinitionWithFeedback,
    saveDefinitionWithFeedbackSync,
    isSavingDefinition,
    definition,
    pluginContainer,
  } = useProjectDefinition();
  const navigate = useNavigate();

  const sectionId = sectionUid
    ? adminSectionEntityType.fromUid(sectionUid)
    : undefined;

  const existingSection = sectionId
    ? appConfig.sections?.find((section) => section.id === sectionId)
    : undefined;

  const schemaWithPlugins = zPluginWrapper(adminSectionSchema, pluginContainer);

  const formProps = useResettableForm<AdminSectionConfig>({
    values: existingSection,
    defaultValues: { type: 'crud' },
    resolver: zodResolver(schemaWithPlugins),
  });

  const { control, handleSubmit, watch, reset } = formProps;

  useEffect(() => {
    reset(existingSection ?? { type: 'crud' });
  }, [reset, existingSection]);

  const onSubmit = handleSubmit((data) => {
    const id = data.id || adminSectionEntityType.generateNewId();
    return saveDefinitionWithFeedback(
      (config) => {
        const adminApp = config.apps.find((app) => app.id === appConfig.id);
        if (adminApp?.type !== 'admin') {
          throw new Error('Cannot add a section to a non-admin app');
        }

        adminApp.sections = sortBy(
          [
            ...(adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            ),
            { ...data, id },
          ],
          [(section) => section.name],
        );
      },
      {
        onSuccess: () => {
          if (!sectionId) {
            navigate(`edit/${adminSectionEntityType.toUid(id)}`);
          }
        },
      },
    );
  });

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const type = watch('type');

  function handleDelete(): void {
    requestConfirm({
      title: 'Delete Section',
      content: `Are you sure you want to delete ${
        existingSection?.name ?? 'this section'
      }?`,
      onConfirm: () => {
        saveDefinitionWithFeedbackSync(
          (config) => {
            const adminApp = config.apps.find((app) => app.id === appConfig.id);
            if (adminApp?.type !== 'admin') {
              throw new Error('Cannot add a section to a non-admin app');
            }

            adminApp.sections = (adminApp.sections ?? []).filter(
              (section) => !sectionId || section.id !== sectionId,
            );
          },
          {
            successMessage: 'Successfully deleted section!',
            onSuccess: () => {
              navigate(`..`);
            },
          },
        );
      },
    });
  }

  const featureOptions = definition.features.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  return (
    <div className={clsx('', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        {sectionId && (
          <LinkButton
            onClick={() => {
              handleDelete();
            }}
          >
            Delete Section
          </LinkButton>
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
          name="featureRef"
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
          switch (type as string) {
            case 'crud': {
              return <AdminCrudSectionForm formProps={formProps} />;
            }
            default: {
              return <div>Unsupported type {type}</div>;
            }
          }
        })()}
        <Button type="submit" disabled={isSavingDefinition}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default AdminEditSectionForm;
