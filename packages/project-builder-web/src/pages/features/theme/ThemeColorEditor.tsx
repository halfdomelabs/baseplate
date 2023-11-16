import { THEME_COLORS, ThemeConfig } from '@halfdomelabs/project-builder-lib';
import { ColorPickerField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { Control, useWatch } from 'react-hook-form';

import { ThemeColorsPreview } from './ThemeColorsPreview';

interface ThemeColorEditorProps {
  className?: string;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
}

export function ThemeColorEditor({
  className,
  control,
  mode,
}: ThemeColorEditorProps): JSX.Element {
  const themeColorEntries = Object.entries(THEME_COLORS);
  const palettes = useWatch({ control, name: 'palettes' });
  return (
    <div className={clsx('flex w-full gap-4', className)}>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {themeColorEntries.map(([key, config], idx) => {
          const themeKey = key as keyof typeof THEME_COLORS;
          const lastCategoryKey =
            idx > 0 ? themeColorEntries[idx - 1][1].categoryKey : undefined;
          const shouldStartNewColumn = lastCategoryKey !== config.categoryKey;
          return (
            <ColorPickerField.Controller
              className={shouldStartNewColumn ? 'col-start-1' : undefined}
              key={key}
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
                return color;
              }}
              name={`colors.${mode}.${themeKey}`}
            />
          );
        })}
      </div>
      <div className="flex-1">
        <ThemeColorsPreview control={control} mode={mode} />
      </div>
    </div>
  );
}
