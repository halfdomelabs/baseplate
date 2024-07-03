import { DialogProps } from '@radix-ui/react-dialog';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Sheet } from './Sheet.js';
import { Button } from '../Button/Button.js';

const meta = {
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function SheetContainer(args: Omit<DialogProps, 'children'>): JSX.Element {
  return (
    <Sheet {...args}>
      <Sheet.Trigger asChild>
        <Button>Open Sheet</Button>
      </Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Edit profile</Sheet.Title>
          <Sheet.Description>
            Make changes to your profile here. Click save when you&apos;re done.
          </Sheet.Description>
        </Sheet.Header>
        <p className="py-4">This is the body content</p>
        <Sheet.Footer className="flex gap-4">
          <Sheet.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Sheet.Close>
          <Sheet.Close asChild>
            <Button>Save Changes</Button>
          </Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <SheetContainer {...args} />,
};

function ControlledSheetContainer(
  args: Omit<DialogProps, 'children' | 'open'>,
): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet {...args} open={open} onOpenChange={(op) => setOpen(op)}>
        <Sheet.Content>
          <p>This is the body content</p>
          <Sheet.Footer>
            <Sheet.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Sheet.Close>
            <Sheet.Close asChild>
              <Button>Delete File</Button>
            </Sheet.Close>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    </div>
  );
}

export const ControlledSheet: Story = {
  args: { children: null, open: false },
  render: (args) => <ControlledSheetContainer {...args} />,
};
