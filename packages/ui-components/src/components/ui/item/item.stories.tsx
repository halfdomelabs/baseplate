import type { Meta, StoryObj } from '@storybook/react-vite';

import { MdFolder, MdPerson, MdSettings, MdStar } from 'react-icons/md';

import { Button } from '../button/button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item.js';

const meta = {
  title: 'components/Item',
  component: Item,
  tags: ['autodocs'],
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemContent>
        <ItemTitle>Default Item</ItemTitle>
        <ItemDescription>
          A simple item with title and description
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithMedia: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon">
        <MdFolder />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Item with Icon</ItemTitle>
        <ItemDescription>An item with an icon media element</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithMediaImage: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="image">
        <img src="https://placehold.co/40x40" alt="placeholder" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Item with Image</ItemTitle>
        <ItemDescription>An item with an image media element</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithActions: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemContent>
        <ItemTitle>Item with Actions</ItemTitle>
        <ItemDescription>This item has action buttons</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="outline" size="sm">
          Delete
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const FullComposition: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon">
        <MdPerson />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Full Item</ItemTitle>
        <ItemDescription>
          An item with media, content, and actions composed together
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          View
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const VariantOutline: Story = {
  render: (args) => (
    <Item {...args} variant="outline">
      <ItemMedia variant="icon">
        <MdStar />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Outline Variant</ItemTitle>
        <ItemDescription>An item with the outline variant</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const VariantMuted: Story = {
  render: (args) => (
    <Item {...args} variant="muted">
      <ItemMedia variant="icon">
        <MdSettings />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Muted Variant</ItemTitle>
        <ItemDescription>An item with the muted variant</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const SizeSmall: Story = {
  render: (args) => (
    <Item {...args} size="sm" variant="outline">
      <ItemMedia variant="icon">
        <MdFolder />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Small Item</ItemTitle>
        <ItemDescription>A smaller item</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const SizeExtraSmall: Story = {
  render: (args) => (
    <Item {...args} size="xs" variant="outline">
      <ItemMedia variant="icon">
        <MdFolder />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Extra Small Item</ItemTitle>
        <ItemDescription>An extra small item</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithHeaderFooter: Story = {
  render: (args) => (
    <Item {...args} variant="outline">
      <ItemHeader>
        <span className="text-xs text-muted-foreground">Header content</span>
      </ItemHeader>
      <ItemMedia variant="icon">
        <MdPerson />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Item with Header and Footer</ItemTitle>
        <ItemDescription>
          This item uses ItemHeader and ItemFooter sub-components
        </ItemDescription>
      </ItemContent>
      <ItemFooter>
        <span className="text-xs text-muted-foreground">Footer content</span>
      </ItemFooter>
    </Item>
  ),
};

export const Group: Story = {
  render: () => (
    <ItemGroup>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <MdFolder />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>First Item</ItemTitle>
          <ItemDescription>Description for the first item</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <MdStar />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Second Item</ItemTitle>
          <ItemDescription>Description for the second item</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <MdSettings />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Third Item</ItemTitle>
          <ItemDescription>Description for the third item</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};

export const GroupWithSeparator: Story = {
  render: () => (
    <ItemGroup>
      <Item>
        <ItemMedia variant="icon">
          <MdFolder />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>First Item</ItemTitle>
          <ItemDescription>Description for the first item</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <MdStar />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Second Item</ItemTitle>
          <ItemDescription>Description for the second item</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <MdSettings />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Third Item</ItemTitle>
          <ItemDescription>Description for the third item</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};

export const AsLink: Story = {
  render: (args) => (
    <Item {...args} variant="outline" render={<a href="#example" />}>
      <ItemMedia variant="icon">
        <MdStar />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Clickable Item</ItemTitle>
        <ItemDescription>
          This item renders as an anchor element via the render prop
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
};
