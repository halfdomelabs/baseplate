import type { Meta, StoryObj } from '@storybook/react-vite';

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
  title: 'components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'sm'] },
  },
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

/** `size="sm"` tightens `--card-spacing`, which drives every slot's padding. */
export const Small: Story = {
  args: {
    size: 'sm',
    children: (
      <>
        <CardHeader>
          <CardTitle>Compact card</CardTitle>
          <CardDescription>Denser padding and a smaller title</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Useful in sidebars and list rows.</p>
        </CardContent>
      </>
    ),
  },
};

/** A card with no footer keeps its bottom padding; the footer removes it. */
export const WithoutFooter: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>No footer</CardTitle>
          <CardDescription>Padding stays symmetric</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Compare the bottom edge against the default story.</p>
        </CardContent>
      </>
    ),
  },
};
