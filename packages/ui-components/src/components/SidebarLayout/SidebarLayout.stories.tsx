import type { Meta, StoryObj } from '@storybook/react';

import { SidebarLayout } from './SidebarLayout.js';

const meta = {
  component: SidebarLayout,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof SidebarLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <SidebarLayout.Sidebar className="space-y-4">
          <h1>Sidebar</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
        </SidebarLayout.Sidebar>
        <SidebarLayout.Content className="space-y-4 p-4">
          <h1>Content</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Maxime
            nihil vero nostrum, obcaecati eveniet dolor commodi tenetur. Saepe
            optio distinctio praesentium? Maiores nobis rem vitae cum quos nulla
            hic quo!
          </p>
        </SidebarLayout.Content>
      </>
    ),
  },
};

export const Scrollbar: Story = {
  args: {
    className: 'max-h-[400px]',
    children: (
      <>
        <SidebarLayout.Sidebar className="space-y-4">
          <h1>Sidebar</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
        </SidebarLayout.Sidebar>
        <SidebarLayout.Content className="space-y-4 p-4">
          <h1>Content</h1>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Maxime
            nihil vero nostrum, obcaecati eveniet dolor commodi tenetur. Saepe
            optio distinctio praesentium? Maiores nobis rem vitae cum quos nulla
            hic quo!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
            doloribus inventore, in voluptatem iste veritatis aperiam, amet,
            officiis quas blanditiis provident sunt ut odit commodi nisi
            quisquam unde esse dolorem!
          </p>
        </SidebarLayout.Content>
      </>
    ),
  },
};
