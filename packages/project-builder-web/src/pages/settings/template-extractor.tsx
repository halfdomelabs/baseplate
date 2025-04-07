import type React from 'react';
import type { z } from 'zod';

import { templateExtractorSchema } from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  CheckboxField,
  InputField,
  SectionList,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWatch } from 'react-hook-form';

import { FormActionBar } from '@src/components';
import { ENABLE_TEMPLATE_EXTRACTOR } from '@src/services/config';

type FormData = z.infer<typeof templateExtractorSchema>;

export function TemplateExtractorSettingsPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const defaultValues = definition.templateExtractor;
  const form = useResettableForm<FormData>({
    resolver: zodResolver(templateExtractorSchema),
    defaultValues,
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.templateExtractor = data;
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const isEnabled = useWatch({ control, name: 'writeMetadata' });

  if (!ENABLE_TEMPLATE_EXTRACTOR) {
    return (
      <Alert variant="error" className="mx-auto my-16 max-w-2xl">
        <Alert.Title>Template Extractor is disabled</Alert.Title>
        <Alert.Description>
          Template extractor is disabled in the environment. Please enable it
          with <code>VITE_ENABLE_TEMPLATE_EXTRACTOR=true</code> to use it.
        </Alert.Description>
      </Alert>
    );
  }

  return (
    <form
      className="relative h-full max-h-full pb-[var(--action-bar-height)]"
      onSubmit={onSubmit}
    >
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 border-b bg-background py-6">
          <h1>Template Extractor</h1>
        </div>
        <SectionList>
          <SectionList.Section>
            <SectionList.SectionHeader>
              <SectionList.SectionTitle>Settings</SectionList.SectionTitle>
            </SectionList.SectionHeader>
            <SectionList.SectionContent className="flex max-w-md flex-col gap-4">
              <CheckboxField.Controller
                name="writeMetadata"
                label="Write Metadata"
                description="Write metadata to the project to enable template extraction"
                control={control}
              />
              <InputField.Controller
                name="generatorPatterns"
                label="Generator Patterns"
                description="A comma-delimited list of generator name patterns to filter which generators will write template extractor metadata. Use `*` to match any characters."
                control={control}
                placeholder="e.g. @halfdomelabs/core:node/*"
                disabled={!isEnabled}
              />
            </SectionList.SectionContent>
          </SectionList.Section>
        </SectionList>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
