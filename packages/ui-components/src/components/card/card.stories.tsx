import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card.js';

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
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consectetur quidem qui architecto placeat nihil officia veritatis
            obcaecati quod reiciendis, numquam corrupti blanditiis laboriosam
            voluptatum minima id nobis soluta nisi error.
          </p>
        </CardContent>
        <CardFooter className="justify-between space-x-4">
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button">Primary</Button>
        </CardFooter>
      </>
    ),
  },
};
