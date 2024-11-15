import type { Meta, StoryObj } from '@storybook/react';

import { MdDelete, MdEdit } from 'react-icons/md';

import { Button } from '../Button/Button.js';
import { RecordView } from './RecordView.js';

const meta = {
  component: RecordView,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof RecordView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <RecordView.ItemList>
          <RecordView.Item title="Name">John Doe</RecordView.Item>
          <RecordView.Item title="Age">30</RecordView.Item>
          <RecordView.Item title="Email">johndoe@example.com</RecordView.Item>
        </RecordView.ItemList>
        <RecordView.Actions>
          <Button variant="ghost" size="icon" type="button">
            <Button.Icon icon={MdEdit} />
          </Button>
          <Button variant="ghost" size="icon" type="button">
            <Button.Icon icon={MdDelete} />
          </Button>
        </RecordView.Actions>
      </>
    ),
  },
};
