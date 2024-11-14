import type { ThemeConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  convertHexToColorName,
  getDefaultThemeColorFromShade,
  THEME_COLORS,
} from '@halfdomelabs/project-builder-lib';
import { Button, ColorPickerField, Tooltip } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';
import { MdInfo, MdRestartAlt } from 'react-icons/md';

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
}: ThemeColorEditorProps): React.JSX.Element {
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
            <div
              className={clsx(
                shouldStartNewColumn ? 'col-start-1' : undefined,
                'relative',
              )}
              key={key}
            >
              <ColorPickerField.Controller
                control={control}
                label={
                  <div className="flex items-center space-x-1">
                    <div>{config.name}</div>
                    <Tooltip delayDuration={500}>
                      <Tooltip.Trigger asChild>
                        <Button.WithIcon
                          variant="ghost"
                          size="icon"
                          icon={MdInfo}
                          aria-label="Color Info"
                          className="opacity-30"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Content
                        align="start"
                        side="bottom"
                        className="max-w-[400px]"
                      >
                        <div className="font-normal">{config.description}</div>
                      </Tooltip.Content>
                    </Tooltip>
                  </div>
                }
                formatColorName={(color) => {
                  const baseShade = Object.entries(palettes.base.shades).find(
                    ([, shadeColor]) => shadeColor === color,
                  )?.[0];
                  if (baseShade) {
                    return `base-${baseShade}`;
                  }
                  const primaryShade = Object.entries(
                    palettes.primary.shades,
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
