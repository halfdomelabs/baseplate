import { SectionList } from '@halfdomelabs/ui-components';

interface GraphQLObjectTypeSectionProps {
  className?: string;
}

export function GraphQLObjectTypeSection({
  className,
}: GraphQLObjectTypeSectionProps): JSX.Element {
  return (
    <SectionList.Section className={className}>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>GraphQL Schema</SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Pick what you would like to expose in your GraphQL schema.
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent>Test</SectionList.SectionContent>
    </SectionList.Section>
  );
}
