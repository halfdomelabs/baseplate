import type React from 'react';

import { enumBaseSchema } from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList } from '@halfdomelabs/ui-components';

import { ErrorBoundary } from '@src/components/ErrorBoundary/ErrorBoundary';
import FormActionBar from '@src/components/FormActionBar';

import { useEnumForm } from '../hooks/useEnumForm';
import { EnumGraphQLSection } from './sections/EnumGraphQLSection';
import { EnumValuesSection } from './sections/EnumValuesSection';

function EnumEditPage(): React.JSX.Element {
  const { form, onSubmit, isSavingDefinition } = useEnumForm({
    schema: enumBaseSchema.omit({ name: true, featureRef: true }),
  });
  const { control, setValue, formState } = form;

  useBlockUnsavedChangesNavigate(formState, {
    reset: form.reset,
    onSubmit,
  });

  return (
    <ErrorBoundary>
      <form
        onSubmit={onSubmit}
        className="mx-4 min-w-[700px] max-w-7xl flex-1 space-y-4 pb-4"
      >
        <SectionList>
          <EnumGraphQLSection control={control} />
          <EnumValuesSection control={control} setValue={setValue} />
        </SectionList>
        <FormActionBar form={form} disabled={isSavingDefinition} />
      </form>
    </ErrorBoundary>
  );
}

export default EnumEditPage;
