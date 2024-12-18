import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../Button/Button.js';
import { Card } from './Card.js';

const meta = {
  component: Card,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Card.Header>
          <Card.Title>Card Title</Card.Title>
          <Card.Description>Card description</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </Card.Content>
        <Card.Footer className="justify-between space-x-4">
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button">Primary</Button>
        </Card.Footer>
      </>
    ),
  },
};
