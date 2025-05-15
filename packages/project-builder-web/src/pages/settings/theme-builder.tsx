import type { ThemeConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import {
  generateDefaultTheme,
  generateThemeColorsFromShade,
  themeSchema,
} from '@halfdomelabs/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
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
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { MdConstruction } from 'react-icons/md';

import { FormActionBar } from '@src/components';

import { ThemeColorsCssDisplay } from './components/ThemeColorsCssDisplay';
import { ThemeColorsEditor } from './components/ThemeColorsEditor';
import { ThemeColorsPreview } from './components/ThemeColorsPreview';
import { ThemePaletteEditor } from './components/ThemePaletteEditor';

export function ThemeBuilderPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();

  const values = useMemo(
    () => definition.theme ?? generateDefaultTheme(),
    [definition.theme],
  );

  const form = useResettableForm<ThemeConfig>({
    resolver: zodResolver(themeSchema),
    values,
  });
  const { control, handleSubmit, setValue, getValues, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.theme = data;
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
