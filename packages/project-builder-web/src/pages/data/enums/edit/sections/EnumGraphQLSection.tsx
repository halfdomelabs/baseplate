import type { EnumConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { SectionList, SwitchField } from '@halfdomelabs/ui-components';

export function EnumGraphQLSection({
  control,
}: {
  control: Control<EnumConfig>;
}): React.JSX.Element {
  return (
    <SectionList.Section>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>GraphQL</SectionList.SectionTitle>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
        <SwitchField.Controller
          label="Expose in GraphQL schema"
          control={control}
          name="isExposed"
          description="Whether to expose this enum in the GraphQL schema"
        />
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
