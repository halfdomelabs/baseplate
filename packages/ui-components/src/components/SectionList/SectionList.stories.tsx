import type { Meta, StoryObj } from '@storybook/react';

import { SectionList } from './SectionList.js';

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
        <SectionList.Section>
          <SectionList.SectionHeader>
            <SectionList.SectionTitle>
              Subsection Title
            </SectionList.SectionTitle>
            <SectionList.SectionDescription>
              This is the description for the subsection.
            </SectionList.SectionDescription>
          </SectionList.SectionHeader>
          <SectionList.SectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionList.SectionContent>
        </SectionList.Section>
        <SectionList.Section>
          <SectionList.SectionHeader>
            <SectionList.SectionTitle>
              Subsection Title
            </SectionList.SectionTitle>
            <SectionList.SectionDescription>
              This is the description for the subsection.
            </SectionList.SectionDescription>
          </SectionList.SectionHeader>
          <SectionList.SectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionList.SectionContent>
        </SectionList.Section>
      </>
    ),
  },
};
