import {
  ThemeConfig,
  generateCssFromThemeConfig,
} from '@halfdomelabs/project-builder-lib';
import { Badge, Button, Card, Combobox } from '@halfdomelabs/ui-components';
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
  const colorCss = colors && generateCssFromThemeConfig(colors);
  return (
    <div
      className={clsx(
        'size-full rounded-md bg-background p-4 shadow-inner',
        className,
      )}
      style={colorCss}
    >
      <Card>
        <Card.Header>
          <Card.Title>Hello World!</Card.Title>
          <Card.Description>Some Card Description</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <p>Hello Hello!</p>
          <Combobox>
            <Combobox.Input placeholder={'Select a color'} />
            <Combobox.Content style={colorCss}>
              <Combobox.Item value="red" label="Red">
                Red
              </Combobox.Item>
              <Combobox.Item value="green" label="Green">
                Green
              </Combobox.Item>
              <Combobox.Item value="blue" label="Blue">
                Blue
              </Combobox.Item>
              <Combobox.Empty>No results found</Combobox.Empty>
            </Combobox.Content>
          </Combobox>

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
