import {
  ThemeConfig,
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
  Button,
  SectionList,
  Tabs,
  toast,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { MdConstruction } from 'react-icons/md';

import { ThemeColorEditor } from './components/ThemeColorEditor';
import { ThemeColorsCssDisplay } from './components/ThemeColorsCssDisplay';
import { ThemePaletteEditor } from './components/ThemePaletteEditor';
import { logAndFormatError } from 'src/services/error-formatter';

export function ThemeBuilderPage(): JSX.Element {
  const { definition, setConfigAndFixReferences } = useProjectDefinition();

  const defaultValues = useMemo(
    () => definition.theme ?? generateDefaultTheme(),
    [definition.theme],
  );

  const { control, handleSubmit, setValue, getValues, formState, reset } =
    useResettableForm<ThemeConfig>({
      resolver: zodResolver(themeSchema),
      defaultValues,
    });

  const onSubmit = handleSubmit((data) => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.theme = data;
      });
      toast.success('Successfully saved configuration!');
      reset(data);
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  });

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
                palettes: defaultValues.palettes,
                config: defaultValues.colors.light,
              },
        ),
        dark: generateThemeColorsFromShade(
          palettes,
          'dark',
          resetColors
            ? undefined
            : {
                palettes: defaultValues.palettes,
                config: defaultValues.colors.dark,
              },
        ),
      });
    },
    [getValues, setValue, defaultValues],
  );

  const handleShadesChange = useCallback(() => {
    generateNewThemeColors();
  }, [generateNewThemeColors]);

  return (
    <div className="relative h-full max-h-full pb-[var(--action-bar-height)]">
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 space-y-2 border-b bg-background py-6">
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
          <Alert>
            <MdConstruction />
            <Alert.Title>Work in Progress</Alert.Title>
            <Alert.Description>
              This page is still a work in progress. It is not being used for
              generation at the moment.
            </Alert.Description>
          </Alert>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
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
              <SectionList.SectionContent>
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
              </SectionList.SectionHeader>
              <SectionList.SectionContent>
                <Tabs defaultValue="light">
                  <Tabs.List>
                    <Tabs.Trigger value="light">Light</Tabs.Trigger>
                    <Tabs.Trigger value="dark">Dark</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="light">
                    <ThemeColorEditor
                      control={control}
                      setValue={setValue}
                      mode="light"
                    />
                  </Tabs.Content>
                  <Tabs.Content value="dark">
                    <ThemeColorEditor
                      control={control}
                      setValue={setValue}
                      mode="dark"
                    />
                  </Tabs.Content>
                </Tabs>
                <Button
                  onClick={() => generateNewThemeColors(true)}
                  variant="secondary"
                  type="button"
                >
                  Reset Colors
                </Button>
              </SectionList.SectionContent>
            </SectionList.Section>
          </SectionList>

          <Button type="submit">Save</Button>

          <h2>CSS Preview</h2>
          <ThemeColorsCssDisplay control={control} />
        </form>
      </div>
    </div>
  );
}
