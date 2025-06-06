import type { ThemeConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  convertHexToOklch,
  convertOklchToColorName,
  convertOklchToHex,
  getDefaultThemeColorFromShade,
  THEME_COLORS,
} from '@baseplate-dev/project-builder-lib';
import {
  Button,
  ColorPickerFieldController,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';
import { MdInfo, MdRestartAlt } from 'react-icons/md';

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
  return (
    <div className={clsx('flex w-full max-w-xl gap-4', className)}>
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
              <ColorPickerFieldController
                control={control}
                className="w-full"
                wrapperClassName="flex-col items-start"
                label={
                  <div className="flex h-6 w-full items-center gap-1">
                    <div>{config.name}</div>
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Color Info"
                          className="opacity-30"
                        >
                          <MdInfo />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        align="start"
                        side="bottom"
                        className="max-w-[400px]"
                      >
                        <div className="font-normal">{config.description}</div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                parseColor={convertOklchToHex}
                serializeColor={convertHexToOklch}
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
                  return convertOklchToColorName(color);
                }}
                name={`colors.${mode}.${themeKey}`}
              />
              {currentColor !== defaultValue && (
                <Button
                  className="absolute right-2 bottom-1"
                  onClick={() => {
                    setValue(`colors.${mode}.${themeKey}`, defaultValue);
                  }}
                  size="icon"
                  variant="ghost"
                  aria-label="Reset Color"
                >
                  <MdRestartAlt />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
