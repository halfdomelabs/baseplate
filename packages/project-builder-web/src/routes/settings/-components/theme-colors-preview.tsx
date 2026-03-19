import type { ThemeConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { generateCssFromThemeConfig } from '@baseplate-dev/project-builder-lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
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
  ComboboxList,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';
import { MdCheckCircle, MdError, MdSearch, MdWarning } from 'react-icons/md';

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
        'size-full space-y-4 rounded-xl border border-border bg-background p-4',
        className,
      )}
      style={colorCss}
    >
      <SurfaceColorsPreview />
      <InteractiveColorsPreview colorCss={colorCss} />
    </div>
  );
}

function SurfaceColorsPreview(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Surfaces</CardTitle>
        <CardDescription>
          Background, card, muted, and status surfaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <PreviewSectionTitle>Text</PreviewSectionTitle>
          <p className="text-base">Regular text on the background surface.</p>
          <p className="text-sm text-muted-foreground">
            Muted secondary text for subtitles and descriptions.
          </p>
        </div>
        <div>
          <PreviewSectionTitle>Status</PreviewSectionTitle>
          <div className="space-y-2">
            <Alert variant="success">
              <MdCheckCircle />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Operation completed.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <MdWarning />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Please review this.</AlertDescription>
            </Alert>
            <Alert variant="error">
              <MdError />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong.</AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InteractiveColorsPreview({
  colorCss,
}: {
  colorCss: Record<string, string>;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive</CardTitle>
        <CardDescription>
          Buttons, inputs, badges, and other controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <PreviewSectionTitle>Input</PreviewSectionTitle>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <MdSearch />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </div>
        <div>
          <PreviewSectionTitle>Combobox</PreviewSectionTitle>
          <Combobox items={['Option 1', 'Option 2', 'Option 3']}>
            <ComboboxInput placeholder="Select an option" />
            <ComboboxContent style={colorCss}>
              <ComboboxEmpty>No results found</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
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
  );
}

function PreviewSectionTitle({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <h4 className="font-semibold">{children}</h4>;
}
