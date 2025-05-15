import type { Meta, StoryObj } from '@storybook/react';

import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionList,
  SectionTitle,
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
        <Section>
          <SectionHeader>
            <SectionTitle>Subsection Title</SectionTitle>
            <SectionDescription>
              This is the description for the subsection.
            </SectionDescription>
          </SectionHeader>
          <SectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionContent>
        </Section>
        <Section>
          <SectionHeader>
            <SectionTitle>Subsection Title</SectionTitle>
            <SectionDescription>
              This is the description for the subsection.
            </SectionDescription>
          </SectionHeader>
          <SectionContent>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur quidem qui architecto placeat nihil officia veritatis
              obcaecati quod reiciendis.
            </p>
          </SectionContent>
        </Section>
      </>
    ),
  },
};
