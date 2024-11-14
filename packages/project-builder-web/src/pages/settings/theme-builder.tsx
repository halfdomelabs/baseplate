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
import { Alert, Button, Tabs, toast } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { MdConstruction } from 'react-icons/md';
import { logAndFormatError } from 'src/services/error-formatter';

import { ThemeColorEditor } from './components/ThemeColorEditor';
import { ThemeColorsCssDisplay } from './components/ThemeColorsCssDisplay';
import { ThemePaletteEditor } from './components/ThemePaletteEditor';

export function ThemeBuilderPage(): React.JSX.Element {
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
    } catch (error) {
      toast.error(logAndFormatError(error));
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
    <div className="max-w-4xl space-y-4">
      <h1>Theme Builder</h1>
      <Alert>
        <MdConstruction />
        <Alert.Title>Work in Progress</Alert.Title>
        <Alert.Description>
          This page is still a work in progress. It is not being used for
          generation at the moment.
        </Alert.Description>
      </Alert>
      <p className="text-style-prose">
        The theme of the UI is based off color variables used with{' '}
        <a
          href="https://ui.shadcn.com/docs/theming"
          target="_blank"
          rel="noreferrer"
        >
          the Shadn UI component library
        </a>
        . We generate the color variables based off the Tailwind color palette
        structure but you can customize them as you wish.
      </p>
      <p>You can customize your theme by choosing one of several methods:</p>
      <ul className="list-inside list-disc text-style-prose">
        <li>
          <strong>Existing Tailwind Theme:</strong> Tailwind has some{' '}
          <a
            href="https://tailwindcss.com/docs/customizing-colors"
            target="_blank"
            rel="noreferrer"
          >
            preset color themes
          </a>{' '}
          that you can use right off the bat.
        </li>
        <li>
          <strong>Choose Base Color:</strong> You can choose a custom base color
          and generate a color theme based off this color.
        </li>
        <li>
          <strong>Customize Colors:</strong> You can customize the colors
          directly for each color variable.
        </li>
      </ul>

      <form onSubmit={onSubmit} className="space-y-4">
        <h2>Theme Palettes</h2>
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

        <h2>Theme Colors</h2>
        <p>Pick the colors for your theme</p>
        <Button
          onClick={() => {
            generateNewThemeColors(true);
          }}
          variant="secondary"
          type="button"
        >
          Reset Colors
        </Button>

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

        <Button type="submit">Save</Button>

        <h2>CSS Preview</h2>
        <ThemeColorsCssDisplay control={control} />
      </form>
    </div>
  );
}
