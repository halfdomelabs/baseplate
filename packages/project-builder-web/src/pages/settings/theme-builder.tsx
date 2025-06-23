import type { ThemeConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createThemeSchema,
  generateDefaultTheme,
  generateThemeColorsFromShade,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { MdConstruction } from 'react-icons/md';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

import { ThemeColorsCssDisplay } from './components/theme-colors-css-display.js';
import { ThemeColorsEditor } from './components/theme-colors-editor.js';
import { ThemeColorsPreview } from './components/theme-colors-preview.js';
import { ThemePaletteEditor } from './components/theme-palette-editor.js';

export function ThemeBuilderPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  const themeSchema = useDefinitionSchema(createThemeSchema);
  const values = useMemo(
    () => definition.settings.theme ?? generateDefaultTheme(),
    [definition.settings.theme],
  );

  const form = useResettableForm<ThemeConfig>({
    resolver: zodResolver(themeSchema),
    values,
  });
  const { control, handleSubmit, setValue, getValues, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.settings.theme = data;
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  const generateNewThemeColors = useCallback(
    (resetColors?: boolean) => {
      const palettes = getValues('palettes');
      setValue('colors', {
        light: generateThemeColorsFromShade(
          palettes,
          'light',
          resetColors
            ? undefined
            : {
                palettes: values.palettes,
                config: values.colors.light,
              },
        ),
        dark: generateThemeColorsFromShade(
          palettes,
          'dark',
          resetColors
            ? undefined
            : {
                palettes: values.palettes,
                config: values.colors.dark,
              },
        ),
      });
    },
    [getValues, setValue, values],
  );

  const handleShadesChange = useCallback(() => {
    generateNewThemeColors();
  }, [generateNewThemeColors]);

  const [themeMode, setThemeMode] = useState<string>('light');

  return (
    <form
      className="relative h-full max-h-full pb-(--action-bar-height)"
      onSubmit={onSubmit}
    >
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 z-10 space-y-2 border-b bg-background py-6">
          <h1>Theme Builder</h1>
          <p className="max-w-3xl text-muted-foreground">
            The theme of the UI is based off color variables used with{' '}
            <a
              href="https://ui.shadcn.com/docs/theming"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              the Shadn UI component library
            </a>
            . We generate the color variables based off the Tailwind color
            palette structure but you can customize them as you wish.
          </p>
        </div>
        <div className="pt-4">
          {/* TODO: check if this should be removed */}
          <Alert className="max-w-fit">
            <MdConstruction />
            <AlertTitle>Work in Progress</AlertTitle>
            <AlertDescription>
              This page is still a work in progress. It is not being used for
              generation at the moment.
            </AlertDescription>
          </Alert>
          <SectionList>
            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>
                  Theme Palettes
                </SectionListSectionTitle>
                <SectionListSectionDescription>
                  Pick the colors for your theme
                </SectionListSectionDescription>
              </SectionListSectionHeader>
              <SectionListSectionContent className="max-w-3xl">
                <Tabs defaultValue="base">
                  <TabsList>
                    <TabsTrigger value="base">Base</TabsTrigger>
                    <TabsTrigger value="primary">Primary</TabsTrigger>
                  </TabsList>
                  <TabsContent value="base">
                    <ThemePaletteEditor
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      type="base"
                      onShadesChange={handleShadesChange}
                    />
                  </TabsContent>
                  <TabsContent value="primary">
                    <ThemePaletteEditor
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      type="primary"
                      onShadesChange={handleShadesChange}
                    />
                  </TabsContent>
                </Tabs>
              </SectionListSectionContent>
            </SectionListSection>
            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>Theme Colors</SectionListSectionTitle>
                <SectionListSectionDescription>
                  Pick the colors for your theme
                </SectionListSectionDescription>
                <div className="sticky top-44">
                  <ThemeColorsPreview
                    key={themeMode} // force rerender
                    control={control}
                    mode={themeMode as 'light' | 'dark'}
                  />
                </div>
              </SectionListSectionHeader>
              <SectionListSectionContent className="flex flex-col gap-4">
                <Tabs value={themeMode} onValueChange={setThemeMode}>
                  <TabsList>
                    <TabsTrigger value="light">Light</TabsTrigger>
                    <TabsTrigger value="dark">Dark</TabsTrigger>
                  </TabsList>
                  <TabsContent value="light">
                    <ThemeColorsEditor
                      control={control}
                      setValue={setValue}
                      mode="light"
                    />
                  </TabsContent>
                  <TabsContent value="dark">
                    <ThemeColorsEditor
                      control={control}
                      setValue={setValue}
                      mode="dark"
                    />
                  </TabsContent>
                </Tabs>
                <Button
                  onClick={() => {
                    generateNewThemeColors(true);
                  }}
                  variant="outline"
                  size="sm"
                  type="button"
                  className="w-fit"
                >
                  Reset Colors
                </Button>
              </SectionListSectionContent>
            </SectionListSection>
            <SectionListSection>
              <SectionListSectionHeader>
                <SectionListSectionTitle>CSS Preview</SectionListSectionTitle>
                <SectionListSectionDescription>
                  Preview the CSS for your theme
                </SectionListSectionDescription>
              </SectionListSectionHeader>
              <SectionListSectionContent className="flex flex-col gap-4">
                <ThemeColorsCssDisplay control={control} />
              </SectionListSectionContent>
            </SectionListSection>
          </SectionList>
        </div>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
