import type { Meta, StoryObj } from '@storybook/react';

import {
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from './SectionList.js';

const meta = {
  component: SectionList,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof SectionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Subsection Title</SectionListSectionTitle>
            <SectionListSectionDescription>
              This is the description for the subsection.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionListSectionContent>
        </SectionListSection>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Subsection Title</SectionListSectionTitle>
            <SectionListSectionDescription>
              This is the description for the subsection.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionListSectionContent>
        </SectionListSection>
      </>
    ),
  },
};
