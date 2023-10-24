import {
  ThemeConfig,
  generateDefaultTheme,
  generateThemeColorsFromShade,
  themeSchema,
} from '@halfdomelabs/project-builder-lib';
import { Button, ToggleTabs } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useResettableForm } from 'src/hooks/useResettableForm';
import { useToast } from 'src/hooks/useToast';
import { logAndFormatError } from 'src/services/error-formatter';
import { ThemeColorEditor } from './ThemeColorEditor';
import { ThemeColorsCssDisplay } from './ThemeColorsCssDisplay';
import { ThemePaletteEditor } from './ThemePaletteEditor';

export function ThemeHomePage(): JSX.Element {
  const { config, setConfigAndFixReferences } = useProjectConfig();
  const toast = useToast();

  const defaultValues = useMemo(
    () => config.theme ?? generateDefaultTheme(),
    [config.theme]
  );

  const { control, handleSubmit, setValue, getValues } =
    useResettableForm<ThemeConfig>({
      resolver: zodResolver(themeSchema),
      defaultValues,
    });

  const handleShadesChange = useCallback(() => {
    const palettes = getValues('palettes');
    setValue('colors', {
      light: generateThemeColorsFromShade(palettes, 'light', {
        palettes: defaultValues.palettes,
        config: defaultValues.colors.light,
      }),
      dark: generateThemeColorsFromShade(palettes, 'dark', {
        palettes: defaultValues.palettes,
        config: defaultValues.colors.dark,
      }),
    });
  }, [getValues, setValue, defaultValues]);

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
      <p>
        The theme of the UI is based off color variables used with{' '}
        <a href="https://ui.shadcn.com/docs/theming">
          the Shadn UI component library
        </a>
        . We generate the color variables based off the Tailwind color palette
        structure but you can customize them as you wish.
      </p>
      <p>You can customize your theme by choosing one of several methods:</p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Existing Tailwind Theme:</strong> Tailwind has some{' '}
          <a href="https://tailwindcss.com/docs/customizing-colors">
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
        <Button type="submit">Save</Button>
        <h2>Theme Palettes</h2>
        <ToggleTabs defaultValue="base">
          <ToggleTabs.List>
            <ToggleTabs.Trigger value="base">Base</ToggleTabs.Trigger>
            <ToggleTabs.Trigger value="primary">Primary</ToggleTabs.Trigger>
          </ToggleTabs.List>
          <ToggleTabs.Content value="base">
            <ThemePaletteEditor
              control={control}
              getValues={getValues}
              setValue={setValue}
              type="base"
              onShadesChange={handleShadesChange}
            />
          </ToggleTabs.Content>
          <ToggleTabs.Content value="primary">
            <ThemePaletteEditor
              control={control}
              getValues={getValues}
              setValue={setValue}
              type="primary"
              onShadesChange={handleShadesChange}
            />
          </ToggleTabs.Content>
        </ToggleTabs>

        <h2>Theme Colors</h2>
        <p>Pick the colors for your theme</p>

        <ToggleTabs defaultValue="light">
          <ToggleTabs.List>
            <ToggleTabs.Trigger value="light">Light</ToggleTabs.Trigger>
            <ToggleTabs.Trigger value="dark">Dark</ToggleTabs.Trigger>
          </ToggleTabs.List>
          <ToggleTabs.Content value="light">
            <ThemeColorEditor control={control} mode="light" />
          </ToggleTabs.Content>
          <ToggleTabs.Content value="dark">
            <ThemeColorEditor control={control} mode="dark" />
          </ToggleTabs.Content>
        </ToggleTabs>

        <h2>CSS Preview</h2>
        <ThemeColorsCssDisplay control={control} />
      </form>
    </div>
  );
}
