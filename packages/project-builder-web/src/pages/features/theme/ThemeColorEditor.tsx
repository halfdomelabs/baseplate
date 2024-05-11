import {
  THEME_COLORS,
  ThemeConfig,
  convertHexToColorName,
  getDefaultThemeColorFromShade,
} from '@halfdomelabs/project-builder-lib';
import { Button, ColorPickerField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { MdRestartAlt } from 'react-icons/md';

import { ThemeColorsPreview } from './ThemeColorsPreview';

interface ThemeColorEditorProps {
  className?: string;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
  setValue: UseFormSetValue<ThemeConfig>;
}

export function ThemeColorEditor({
  className,
  control,
  mode,
  setValue,
}: ThemeColorEditorProps): JSX.Element {
  const themeColorEntries = Object.entries(THEME_COLORS);
  const palettes = useWatch({ control, name: 'palettes' });
  const themeColors = useWatch({ control, name: `colors.${mode}` });
  return (
    <div className={clsx('flex w-full gap-4', className)}>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {themeColorEntries.map(([key, config], idx) => {
          const themeKey = key as keyof typeof THEME_COLORS;
          const lastCategoryKey =
            idx > 0 ? themeColorEntries[idx - 1][1].groupKey : undefined;
          const shouldStartNewColumn = lastCategoryKey !== config.groupKey;
          const currentColor = themeColors[themeKey];
          const defaultValue = getDefaultThemeColorFromShade(
            palettes,
            mode,
            themeKey,
          );
          return (
            <div className="relative" key={key}>
              <ColorPickerField.Controller
                className={shouldStartNewColumn ? 'col-start-1' : undefined}
                control={control}
                label={config.name}
                formatLabel={(color) => {
                  const baseShade = Object.entries(
                    palettes.base.shades ?? {},
                  ).find(([, shadeColor]) => shadeColor === color)?.[0];
                  if (baseShade) {
                    return `base-${baseShade}`;
                  }
                  const primaryShade = Object.entries(
                    palettes.primary.shades ?? {},
                  ).find(([, shadeColor]) => shadeColor === color)?.[0];
                  if (primaryShade) {
                    return `primary-${primaryShade}`;
                  }
                  return convertHexToColorName(color);
                }}
                name={`colors.${mode}.${themeKey}`}
              />
              {currentColor !== defaultValue && (
                <Button.WithIcon
                  className="absolute bottom-1 right-2"
                  onClick={() => {
                    setValue(`colors.${mode}.${themeKey}`, defaultValue);
                  }}
                  size="icon"
                  variant="ghost"
                  icon={MdRestartAlt}
                  aria-label="Reset Color"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex-1">
        <ThemeColorsPreview control={control} mode={mode} />
      </div>
    </div>
  );
}
