import type { Meta, StoryObj } from '@storybook/react';

import { MdDelete, MdEdit } from 'react-icons/md';

import { Button } from '../Button/Button.js';
import {
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
} from './RecordView.js';

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
        <RecordViewItemList>
          <RecordViewItem title="Name">John Doe</RecordViewItem>
          <RecordViewItem title="Age">30</RecordViewItem>
          <RecordViewItem title="Email">johndoe@example.com</RecordViewItem>
        </RecordViewItemList>
        <RecordViewActions>
          <Button variant="ghost" size="icon" type="button">
            <MdEdit />
          </Button>
          <Button variant="ghost" size="icon" type="button">
            <MdDelete />
          </Button>
        </RecordViewActions>
      </>
    ),
  },
};
