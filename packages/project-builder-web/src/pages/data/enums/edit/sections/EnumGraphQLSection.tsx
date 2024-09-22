import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import { SectionList, SwitchField } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

export function EnumGraphQLSection({
  control,
}: {
  control: Control<EnumConfig>;
}): JSX.Element {
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
