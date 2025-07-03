import type React from 'react';

import { createEnumBaseSchema } from '@baseplate-dev/project-builder-lib';
import { useBlockUnsavedChangesNavigate } from '@baseplate-dev/project-builder-lib/web';
import { FormActionBar, SectionList } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';

import { ErrorBoundary } from '#src/components/index.js';
import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

import { useEnumForm } from '../-hooks/use-enum-form.js';
import { EnumGraphQLSection } from './-components/enum-graph-ql-section.js';
import { EnumValuesSection } from './-components/enum-values-section.js';

export const Route = createFileRoute('/data/enums/edit/$key/')({
  component: EnumEditPage,
  beforeLoad: () => ({
    getTitle: () => 'Edit Enum',
  }),
});

function EnumEditPage(): React.JSX.Element {
  const { key } = Route.useParams();
  const enumBaseSchema = useDefinitionSchema(createEnumBaseSchema);
  const { form, onSubmit, isSavingDefinition } = useEnumForm({
    schema: enumBaseSchema.omit({ name: true, featureRef: true }),
    enumKey: key,
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
