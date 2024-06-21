import {
  ThemeConfig,
  generateDefaultTheme,
  generateThemeColorsFromShade,
  themeSchema,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Alert, Button, Tabs } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { MdConstruction } from 'react-icons/md';

import { ThemeColorEditor } from './ThemeColorEditor';
import { ThemeColorsCssDisplay } from './ThemeColorsCssDisplay';
import { ThemePaletteEditor } from './ThemePaletteEditor';
import { useBlockDirtyFormNavigate } from '@src/hooks/useBlockDirtyFormNavigate';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
import { logAndFormatError } from 'src/services/error-formatter';

export function ThemeHomePage(): JSX.Element {
  const { config, setConfigAndFixReferences } = useProjectDefinition();
  const toast = useToast();

  const defaultValues = useMemo(
    () => config.theme ?? generateDefaultTheme(),
    [config.theme],
  );

  const { control, handleSubmit, setValue, getValues, formState } =
    useResettableForm<ThemeConfig>({
      resolver: zodResolver(themeSchema),
      defaultValues,
    });

  useBlockDirtyFormNavigate(formState);

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

  const onSubmit = (data: ThemeConfig): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.theme = data;
      });
      toast.success('Successfully saved configuration!');
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  };

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          onClick={() => generateNewThemeColors(true)}
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
