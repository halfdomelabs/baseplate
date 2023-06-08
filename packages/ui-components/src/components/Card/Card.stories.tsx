import type { Meta, StoryObj } from '@storybook/react';
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
      <Card.Body className="space-y-4">
        <h1>This is a card</h1>
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Consectetur
          quidem qui architecto placeat nihil officia veritatis obcaecati quod
          reiciendis, numquam corrupti blanditiis laboriosam voluptatum minima
          id nobis soluta nisi error.
        </p>
      </Card.Body>
    ),
  },
};
