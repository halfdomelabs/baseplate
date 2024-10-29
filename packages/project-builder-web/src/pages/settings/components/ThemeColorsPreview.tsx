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
        'size-full rounded-xl border border-border bg-background p-4',
        className,
      )}
      style={colorCss}
    >
      <Card>
        <Card.Header>
          <Card.Title>Color Preview</Card.Title>
          <Card.Description>
            This is a preview of how your theme colors will be applied on
            various elements
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div>
            <PreviewSectionTitle>Paragraph Text</PreviewSectionTitle>
            <p className="text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
              faucibus.
            </p>
          </div>
          <div>
            <PreviewSectionTitle>Combobox</PreviewSectionTitle>
            <Combobox>
              <Combobox.Input placeholder={'Select an option'} />
              <Combobox.Content style={colorCss}>
                <Combobox.Item value="opt1" label="Option 1">
                  Option 1
                </Combobox.Item>
                <Combobox.Item value="green" label="Option 2">
                  Option 2
                </Combobox.Item>
                <Combobox.Item value="blue" label="Option 3">
                  Option 3
                </Combobox.Item>
                <Combobox.Empty>No results found</Combobox.Empty>
              </Combobox.Content>
            </Combobox>
          </div>
          <div>
            <PreviewSectionTitle>Badges</PreviewSectionTitle>
            <div className="flex flex-wrap gap-1">
              <Badge variant="default">Default</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          <div>
            <PreviewSectionTitle>Buttons</PreviewSectionTitle>
            <div className="flex flex-wrap gap-2 rounded-lg border border-border p-1">
              <Button type="button">Primary</Button>
              <Button variant="destructive" type="button">
                Destructive
              </Button>
              <Button variant="ghost" type="button">
                Ghost
              </Button>
              <Button variant="link" type="button">
                Link
              </Button>
              <Button variant="outline" type="button">
                Outline
              </Button>
              <Button variant="secondary" type="button">
                Secondary
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function PreviewSectionTitle({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <h4 className="text-lg font-semibold">{children}</h4>;
}
