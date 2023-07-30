import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Dropdown } from './Dropdown';

const meta = {
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-4">
      <Dropdown>
        <Dropdown.Trigger asChild>
          <Button>Open</Button>
        </Dropdown.Trigger>
        <Dropdown.Content className="w-56">
          <Dropdown.Group>
            <Dropdown.Item>
              <span>Profile</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Billing</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Settings</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Keyboard shortcuts</span>
            </Dropdown.Item>
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown>
    </div>
  ),
};

export const FullExample: Story = {
  render: () => (
    <div className="p-4">
      <Dropdown>
        <Dropdown.Trigger asChild>
          <Button>Open</Button>
        </Dropdown.Trigger>
        <Dropdown.Content className="w-56">
          <Dropdown.Label>My Account</Dropdown.Label>
          <Dropdown.Separator />
          <Dropdown.Group>
            <Dropdown.Item>
              <span>Profile</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Billing</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Settings</span>
            </Dropdown.Item>
            <Dropdown.Item>
              <span>Keyboard shortcuts</span>
            </Dropdown.Item>
          </Dropdown.Group>
          <Dropdown.Separator />
          <Dropdown.Group>
            <Dropdown.Item>
              <span>Team</span>
            </Dropdown.Item>
            <Dropdown.Sub>
              <Dropdown.SubTrigger>
                <span>Invite users</span>
              </Dropdown.SubTrigger>
              <Dropdown.Portal>
                <Dropdown.SubContent className="">
                  <Dropdown.Item>
                    <span>Email</span>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <span>Message</span>
                  </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Item>
                    <span>More...</span>
                  </Dropdown.Item>
                </Dropdown.SubContent>
              </Dropdown.Portal>
            </Dropdown.Sub>
            <Dropdown.Item>
              <span>New Team</span>
            </Dropdown.Item>
          </Dropdown.Group>
          <Dropdown.Separator />
          <Dropdown.Item>
            <span>GitHub</span>
          </Dropdown.Item>
          <Dropdown.Item>
            <span>Support</span>
          </Dropdown.Item>
          <Dropdown.Item disabled>
            <span>API</span>
          </Dropdown.Item>
          <Dropdown.Separator />
          <Dropdown.Item>
            <span>Log out</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>
    </div>
  ),
};

type Checked = DropdownMenuCheckboxItemProps['checked'];

export const DropdownWithCheckboxes: Story = {
  render: () => {
    const [showStatusBar, setShowStatusBar] = useState<Checked>(true);
    const [showActivityBar, setShowActivityBar] = useState<Checked>(false);
    const [showPanel, setShowPanel] = useState<Checked>(false);

    return (
      <div className="p-4">
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button>Open</Button>
          </Dropdown.Trigger>
          <Dropdown.Content className="w-56">
            <Dropdown.Label>Appearance</Dropdown.Label>
            <Dropdown.Separator />
            <Dropdown.CheckboxItem
              checked={showStatusBar}
              onCheckedChange={setShowStatusBar}
            >
              Status Bar
            </Dropdown.CheckboxItem>
            <Dropdown.CheckboxItem
              checked={showActivityBar}
              onCheckedChange={setShowActivityBar}
              disabled
            >
              Activity Bar
            </Dropdown.CheckboxItem>
            <Dropdown.CheckboxItem
              checked={showPanel}
              onCheckedChange={setShowPanel}
            >
              Panel
            </Dropdown.CheckboxItem>
          </Dropdown.Content>
        </Dropdown>
      </div>
    );
  },
};

export const DropdownWithRadioGroup: Story = {
  render: () => {
    const [position, setPosition] = useState('bottom');

    return (
      <div className="p-4">
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button>Open</Button>
          </Dropdown.Trigger>
          <Dropdown.Content className="w-56">
            <Dropdown.Label>Panel Position</Dropdown.Label>
            <Dropdown.Separator />
            <Dropdown.RadioGroup value={position} onValueChange={setPosition}>
              <Dropdown.RadioItem value="top">Top</Dropdown.RadioItem>
              <Dropdown.RadioItem value="bottom">Bottom</Dropdown.RadioItem>
              <Dropdown.RadioItem value="right">Right</Dropdown.RadioItem>
            </Dropdown.RadioGroup>
          </Dropdown.Content>
        </Dropdown>
      </div>
    );
  },
};
