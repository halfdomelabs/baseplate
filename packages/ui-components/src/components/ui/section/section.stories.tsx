import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/button.js';
import { Card, CardContent, CardTitle } from '../card/card.js';
import {
  Section,
  SectionActions,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from './section.js';

const meta = {
  title: 'components/Section',
  component: Section,
  tags: ['autodocs'],
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Section className="max-w-2xl">
      <SectionHeader>
        <SectionTitle>Apps</SectionTitle>
        <SectionDescription>
          These are the apps that are defined in your project.
        </SectionDescription>
      </SectionHeader>
      <Card className="p-4">
        <CardTitle render={<h3 />}>admin</CardTitle>
        <CardContent className="px-0 text-sm text-muted-foreground">
          An admin dashboard for managing content.
        </CardContent>
      </Card>
    </Section>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Section className="max-w-2xl">
      <SectionHeader>
        <SectionTitle>Form</SectionTitle>
      </SectionHeader>
    </Section>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Section className="max-w-2xl">
      <SectionHeader>
        <SectionTitle>Libraries</SectionTitle>
        <SectionDescription>
          Library packages that can be shared across apps.
        </SectionDescription>
        <SectionActions>
          <Button size="sm">Add library</Button>
        </SectionActions>
      </SectionHeader>
    </Section>
  ),
};

/** The title element is a default, not a rule — pick the level the page needs. */
export const CustomHeadingLevel: Story = {
  render: () => (
    <Section className="max-w-2xl">
      <SectionHeader>
        <SectionTitle render={<h3 />}>A nested section</SectionTitle>
        <SectionDescription>
          Rendered as an <code>h3</code> because it sits under another section.
        </SectionDescription>
      </SectionHeader>
    </Section>
  ),
};
