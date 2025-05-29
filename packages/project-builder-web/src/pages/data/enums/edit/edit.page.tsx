import type React from 'react';

import { enumBaseSchema } from '@halfdomelabs/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@halfdomelabs/project-builder-lib/web';
import { SectionList } from '@halfdomelabs/ui-components';

import { ErrorBoundary, FormActionBar } from '#src/components/index.js';

import { useEnumForm } from '../hooks/useEnumForm.js';
import { EnumGraphQLSection } from './sections/EnumGraphQLSection.js';
import { EnumValuesSection } from './sections/EnumValuesSection.js';

function EnumEditPage(): React.JSX.Element {
  const { form, onSubmit, isSavingDefinition } = useEnumForm({
    schema: enumBaseSchema.omit({ name: true, featureRef: true }),
  });
  const { control, setValue } = form;

  useBlockUnsavedChangesNavigate({ control, reset: form.reset, onSubmit });

  return (
    <ErrorBoundary>
      <form
        onSubmit={onSubmit}
        className="mx-4 max-w-7xl min-w-[700px] flex-1 space-y-4 pb-4"
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
