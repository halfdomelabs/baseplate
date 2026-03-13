import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import { useState } from 'react';

import { Button } from '../button/button.js';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet.js';

const meta = {
  title: 'components/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function SheetContainer(
  args: Omit<React.ComponentProps<typeof Sheet>, 'children'>,
): React.JSX.Element {
  return (
    <Sheet {...args}>
      <SheetTrigger render={<Button />}>Open Sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <p className="px-4">This is the body content</p>
        <SheetFooter className="flex gap-4">
          <SheetClose render={<Button variant="secondary" />}>
            Cancel
          </SheetClose>
          <SheetClose render={<Button />}>Save Changes</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const Default: Story = {
  args: { children: null },
  render: (args) => <SheetContainer {...args} />,
};

function ControlledSheetContainer(
  args: Omit<React.ComponentProps<typeof Sheet>, 'children' | 'open'>,
): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open sheet
      </Button>
      <Sheet
        {...args}
        open={open}
        onOpenChange={(op) => {
          setOpen(op);
        }}
      >
        <SheetContent>
          <div className="px-4">
            <p>This is the body content</p>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="secondary" />}>
              Cancel
            </SheetClose>
            <SheetClose render={<Button />}>Delete File</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const ControlledSheet: Story = {
  args: { children: null, open: false },
  render: (args) => <ControlledSheetContainer {...args} />,
};
