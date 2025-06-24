import type { Meta, StoryObj } from '@storybook/react';
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
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <p className="py-4">This is the body content</p>
        <SheetFooter className="flex gap-4">
          <SheetClose asChild>
            <Button variant="secondary">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Save Changes</Button>
          </SheetClose>
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
          <p>This is the body content</p>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="secondary">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button>Delete File</Button>
            </SheetClose>
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
