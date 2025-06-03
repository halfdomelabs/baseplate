import type { ThemeConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { generateCssFromThemeConfig } from '@baseplate-dev/project-builder-lib';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';

interface ThemeColorsPreviewProps {
  className?: string;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
}

export function ThemeColorsPreview({
  className,
  control,
  mode,
}: ThemeColorsPreviewProps): React.JSX.Element {
  const colors = useWatch({
    control,
    name: `colors.${mode}`,
  });
  const colorCss = generateCssFromThemeConfig(colors);
  return (
    <div
      className={clsx(
        'size-full rounded-xl border border-border bg-background p-4',
        className,
      )}
      style={colorCss}
    >
      <Card>
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
          <CardDescription>
            This is a preview of how your theme colors will be applied on
            various elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <ComboboxInput placeholder={'Select an option'} />
              <ComboboxContent style={colorCss}>
                <ComboboxItem value="opt1" label="Option 1">
                  Option 1
                </ComboboxItem>
                <ComboboxItem value="green" label="Option 2">
                  Option 2
                </ComboboxItem>
                <ComboboxItem value="blue" label="Option 3">
                  Option 3
                </ComboboxItem>
                <ComboboxEmpty>No results found</ComboboxEmpty>
              </ComboboxContent>
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
              <Button variant="secondary" type="button">
                Secondary
              </Button>
              <Button variant="outline" type="button">
                Outline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewSectionTitle({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <h4 className="text-lg font-semibold">{children}</h4>;
}
