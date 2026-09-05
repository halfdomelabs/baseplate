import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent } from '../card/card.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Input } from '../input/input.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from './field.js';

const meta = {
  title: 'components/Field',
  component: Field,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <FieldLabel htmlFor="field-default">Project name</FieldLabel>
        <Input id="field-default" placeholder="my-project" />
        <FieldDescription>Used as the directory name.</FieldDescription>
      </>
    ),
  },
};

export const Invalid: Story = {
  args: { children: null },
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="field-invalid">Project name</FieldLabel>
      <Input id="field-invalid" aria-invalid defaultValue="My Project" />
      <FieldError>Lowercase letters and dashes only.</FieldError>
    </Field>
  ),
};

/**
 * A `FieldLabel` wrapping a control draws the focus ring itself, so focusing
 * the checkbox rings the whole row rather than the box.
 */
export const LabelWrappedControl: Story = {
  args: {
    children: (
      <FieldLabel>
        <Field orientation="horizontal">
          <Checkbox />
          <FieldLabel>Send me release notes</FieldLabel>
        </Field>
      </FieldLabel>
    ),
  },
};

/**
 * `FieldSeparator`'s label paints `bg-panel-background`, so it punches through
 * whichever surface the group sits on. Switch the Palette toolbar to "stress"
 * to see the page and card cases resolve to different colours.
 */
export const SeparatorOnPage: Story = {
  args: { children: null },
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="sep-page">Email</FieldLabel>
        <Input id="sep-page" placeholder="you@example.com" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="sep-page-2">Username</FieldLabel>
        <Input id="sep-page-2" placeholder="octocat" />
      </Field>
    </FieldGroup>
  ),
};

export const SeparatorInCard: Story = {
  args: { children: null },
  render: () => (
    <Card>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sep-card">Email</FieldLabel>
            <Input id="sep-card" placeholder="you@example.com" />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="sep-card-2">Username</FieldLabel>
            <Input id="sep-card-2" placeholder="octocat" />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  ),
};
