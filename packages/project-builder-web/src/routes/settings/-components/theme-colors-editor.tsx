import type { ThemeConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  convertOklchToColorName,
  getDefaultThemeColorFromShade,
  THEME_COLORS,
} from '@baseplate-dev/project-builder-lib';
import { clsx } from 'clsx';
import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';

import { ThemeColorPicker } from './theme-color-picker.js';

interface ThemeColorEditorProps {
  className?: string;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
  setValue: UseFormSetValue<ThemeConfig>;
}

export function ThemeColorsEditor({
  className,
  control,
  mode,
  setValue,
}: ThemeColorEditorProps): React.JSX.Element {
  const themeColorEntries = Object.entries(THEME_COLORS);
  const palettes = useWatch({ control, name: 'palettes' });
  const themeColors = useWatch({ control, name: `colors.${mode}` });

  const formatColorName = useCallback(
    (color: string): string => {
      const baseShade = Object.entries(palettes.base.shades).find(
        ([, shadeColor]) => shadeColor === color,
      )?.[0];
      if (baseShade) {
        return `base-${baseShade}`;
      }
      const primaryShade = Object.entries(palettes.primary.shades).find(
        ([, shadeColor]) => shadeColor === color,
      )?.[0];
      if (primaryShade) {
        return `primary-${primaryShade}`;
      }
      return convertOklchToColorName(color);
    },
    [palettes],
  );

  return (
    <div className={clsx('flex w-full max-w-xl gap-4', className)}>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {themeColorEntries.map(([key, config], idx) => {
          const themeKey = key as keyof typeof THEME_COLORS;
          const lastCategoryKey =
            idx > 0 ? themeColorEntries[idx - 1][1].groupKey : undefined;
          const shouldStartNewColumn = lastCategoryKey !== config.groupKey;
          return (
            <div
              className={clsx(shouldStartNewColumn ? 'col-start-1' : undefined)}
              key={key}
            >
              <ThemeColorPicker
                control={control}
                name={`colors.${mode}.${themeKey}`}
                label={config.name}
                description={config.description}
                currentValue={themeColors[themeKey]}
                defaultValue={getDefaultThemeColorFromShade(
                  palettes,
                  mode,
                  themeKey,
                )}
                baseShades={palettes.base.shades}
                primaryShades={palettes.primary.shades}
                setValue={setValue}
                formatColorName={formatColorName}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
