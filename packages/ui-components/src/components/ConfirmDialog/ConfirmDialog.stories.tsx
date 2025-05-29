import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';

import { useConfirmDialog } from '#src/hooks/useConfirmDialog.js';

import { Button } from '../index.js';
import { ConfirmDialog } from './ConfirmDialog.js';

const meta = {
  component: ConfirmDialog,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'onConfirm' },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function ConfirmDialogContainer({
  onConfirm,
}: {
  onConfirm?: () => void;
}): React.JSX.Element {
  const confirmDialog = useConfirmDialog();
  return (
    <div>
      <Button
        onClick={() => {
          confirmDialog.requestConfirm({
            title: 'Are you sure you want to delete this item?',
            content: 'Deletions are permanent and cannot be reversed.',
            buttonConfirmText: 'Delete',
            buttonConfirmVariant: 'destructive',
            onConfirm,
          });
        }}
        variant="destructive"
      >
        Delete
      </Button>
      <ConfirmDialog />
    </div>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <ConfirmDialogContainer {...args} />,
};
