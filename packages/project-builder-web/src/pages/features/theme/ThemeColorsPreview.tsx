import {
  ThemeConfig,
  generateCssFromThemeConfig,
} from '@halfdomelabs/project-builder-lib';
import {
  Badge,
  Button,
  Card,
  ComboboxField,
} from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control, useWatch } from 'react-hook-form';

interface ThemeColorsPreviewProps {
  className?: string;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
}

export function ThemeColorsPreview({
  className,
  control,
  mode,
}: ThemeColorsPreviewProps): JSX.Element {
  const colors = useWatch({
    control,
    name: `colors.${mode}`,
  });
  return (
    <div
      className={clsx(
        'h-full w-full rounded-md bg-background p-4 shadow-inner',
        className,
      )}
      style={colors && generateCssFromThemeConfig(colors)}
    >
      <Card>
        <Card.Header>
          <Card.Title>Hello World!</Card.Title>
          <Card.Description>Some Card Description</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <p>Hello Hello!</p>
          <ComboboxField
            label="What is your favorite color?"
            description="Choose anything you want"
            options={[
              { label: 'Red', value: 'red' },
              { label: 'Green', value: 'green' },
              { label: 'Blue', value: 'blue' },
            ]}
          />
          <h2>Badges</h2>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
        </Card.Content>
        <Card.Footer className="flex gap-4">
          <Button type="button">Primary</Button>
          <Button variant="secondary" type="button">
            Secondary
          </Button>
          <Button variant="destructive" type="button">
            Delete
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
