import type {
  PalettesConfig,
  ThemeColorConfig,
  ThemeColorKey,
  ThemeConfig,
} from '@baseplate-dev/project-builder-lib';
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

interface ColorSection {
  title: string;
  description: string;
  entries: [ThemeColorKey, ThemeColorConfig][];
}

const CATEGORY_INFO: Record<string, { title: string; description: string }> = {
  surface: {
    title: 'Surface Colors',
    description:
      'Background, card, and status colors that define the visual layers of your app.',
  },
  interactive: {
    title: 'Interactive Colors',
    description:
      'Colors for buttons, links, and other elements users interact with.',
  },
  utility: {
    title: 'Utility Colors',
    description: 'Borders, input outlines, and focus ring colors.',
  },
};

const CATEGORY_ORDER = ['surface', 'interactive', 'utility'];

function buildColorSections(): ColorSection[] {
  const grouped = new Map<string, [ThemeColorKey, ThemeColorConfig][]>();
  for (const [key, config] of Object.entries(THEME_COLORS)) {
    const { category } = config;
    const existing = grouped.get(category) ?? [];
    existing.push([key as ThemeColorKey, config]);
    grouped.set(category, existing);
  }
  const defaultInfo = { title: '', description: '' };
  return CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => ({
    ...(CATEGORY_INFO[cat] ?? defaultInfo),
    entries: grouped.get(cat) ?? [],
  }));
}

const COLOR_SECTIONS = buildColorSections();

export function ThemeColorsEditor({
  className,
  control,
  mode,
  setValue,
}: ThemeColorEditorProps): React.JSX.Element {
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
    <div className={clsx('flex w-full max-w-xl flex-col gap-6', className)}>
      {COLOR_SECTIONS.map((section) => (
        <ColorSectionGrid
          key={section.title}
          section={section}
          control={control}
          mode={mode}
          palettes={palettes}
          themeColors={themeColors}
          setValue={setValue}
          formatColorName={formatColorName}
        />
      ))}
    </div>
  );
}

function ColorSectionGrid({
  section,
  control,
  mode,
  palettes,
  themeColors,
  setValue,
  formatColorName,
}: {
  section: ColorSection;
  control: Control<ThemeConfig>;
  mode: 'light' | 'dark';
  palettes: PalettesConfig;
  themeColors: Record<string, string | undefined>;
  setValue: UseFormSetValue<ThemeConfig>;
  formatColorName: (color: string) => string;
}): React.JSX.Element {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold">{section.title}</h3>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.entries.map(([themeKey, config], idx) => {
          const lastGroupKey =
            idx > 0 ? section.entries[idx - 1][1].groupKey : undefined;
          const shouldStartNewColumn = lastGroupKey !== config.groupKey;
          return (
            <div
              className={clsx(shouldStartNewColumn ? 'col-start-1' : undefined)}
              key={themeKey}
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
