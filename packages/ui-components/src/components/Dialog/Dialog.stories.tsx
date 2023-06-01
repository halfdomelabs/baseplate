import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../index.js';
import { Dialog, DialogProps } from './Dialog.js';

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogContainer(
  args: Omit<DialogProps, 'onClose' | 'isOpen' | 'children'>
): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Header onClose={() => setIsOpen(false)}>
          Dialog Title
        </Dialog.Header>
        <Dialog.Body>
          <p>Dialog body</p>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={() => setIsOpen(false)}>Do Action</Button>
        </Dialog.Footer>
      </Dialog>
    </div>
  );
}

export const Default: Story = {
  args: { onClose: () => {}, children: '' },
  render: (args) => <DialogContainer {...args} />,
};
