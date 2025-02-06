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
import { Alert, Button, SectionList, Tabs } from '@halfdomelabs/ui-components';
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
  const { control, handleSubmit, setValue, getValues, formState, reset } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.theme = data;
    }),
  );

  useBlockUnsavedChangesNavigate(formState, { reset, onSubmit });

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
      className="relative h-full max-h-full pb-[var(--action-bar-height)]"
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
            <Alert.Title>Work in Progress</Alert.Title>
            <Alert.Description>
              This page is still a work in progress. It is not being used for
              generation at the moment.
            </Alert.Description>
          </Alert>
          <SectionList>
            <SectionList.Section>
              <SectionList.SectionHeader>
                <SectionList.SectionTitle>
                  Theme Palettes
                </SectionList.SectionTitle>
                <SectionList.SectionDescription>
                  Pick the colors for your theme
                </SectionList.SectionDescription>
              </SectionList.SectionHeader>
              <SectionList.SectionContent className="max-w-3xl">
                <Tabs defaultValue="base">
                  <Tabs.List>
                    <Tabs.Trigger value="base">Base</Tabs.Trigger>
                    <Tabs.Trigger value="primary">Primary</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="base">
                    <ThemePaletteEditor
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      type="base"
                      onShadesChange={handleShadesChange}
                    />
                  </Tabs.Content>
                  <Tabs.Content value="primary">
                    <ThemePaletteEditor
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      type="primary"
                      onShadesChange={handleShadesChange}
                    />
                  </Tabs.Content>
                </Tabs>
              </SectionList.SectionContent>
            </SectionList.Section>
            <SectionList.Section>
              <SectionList.SectionHeader>
                <SectionList.SectionTitle>
                  Theme Colors
                </SectionList.SectionTitle>
                <SectionList.SectionDescription>
                  Pick the colors for your theme
                </SectionList.SectionDescription>
                <div className="sticky top-44">
                  <ThemeColorsPreview
                    key={themeMode} // force rerender
                    control={control}
                    mode={themeMode as 'light' | 'dark'}
                  />
                </div>
              </SectionList.SectionHeader>
              <SectionList.SectionContent className="flex flex-col gap-4">
                <Tabs value={themeMode} onValueChange={setThemeMode}>
                  <Tabs.List>
                    <Tabs.Trigger value="light">Light</Tabs.Trigger>
                    <Tabs.Trigger value="dark">Dark</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="light">
                    <ThemeColorsEditor
                      control={control}
                      setValue={setValue}
                      mode="light"
                    />
                  </Tabs.Content>
                  <Tabs.Content value="dark">
                    <ThemeColorsEditor
                      control={control}
                      setValue={setValue}
                      mode="dark"
                    />
                  </Tabs.Content>
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
              </SectionList.SectionContent>
            </SectionList.Section>
            <SectionList.Section>
              <SectionList.SectionHeader>
                <SectionList.SectionTitle>CSS Preview</SectionList.SectionTitle>
                <SectionList.SectionDescription>
                  Preview the CSS for your theme
                </SectionList.SectionDescription>
              </SectionList.SectionHeader>
              <SectionList.SectionContent className="flex flex-col gap-4">
                <ThemeColorsCssDisplay control={control} />
              </SectionList.SectionContent>
            </SectionList.Section>
          </SectionList>
        </div>
      </div>
      <FormActionBar form={form} />
    </form>
  );
}
