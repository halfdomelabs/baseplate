import type { Meta, StoryObj } from '@storybook/react';

import { SectionList } from './SectionList.js';
import { Button } from '../Button/Button.js';
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
        <SectionList.Section
          title="Section Title 1"
          description="This is the description for section 1."
        >
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis.
          </p>
        </SectionList.Section>
        <SectionList.Section
          title="Section Title 2"
          description="This is the description for section 2."
        >
          <Button type="button">Click Me</Button>
        </SectionList.Section>
      </>
    ),
  },
};
