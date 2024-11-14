import type {
  ColorPaletteName,
  PaletteShades,
  ThemeConfig,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type {
  Control,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form';

import {
  COLOR_PALETTES,
  PALETTE_SHADES,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ColorPickerField,
  ComboboxField,
} from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { capitalize } from 'inflection';
import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';

import { generatePalette } from '../theme-utils/palette-generator';

interface ThemePaletteEditorProps {
  control: Control<ThemeConfig>;
  className?: string;
  getValues: UseFormGetValues<ThemeConfig>;
  setValue: UseFormSetValue<ThemeConfig>;
  onShadesChange?: (shades: Partial<PaletteShades>) => void;
  type: 'base' | 'primary';
}

export function ThemePaletteEditor({
  control,
  className,
  getValues,
  setValue,
  onShadesChange,
  type,
}: ThemePaletteEditorProps): React.JSX.Element {
  const paletteOptions = [
    { value: 'custom', label: 'Custom Base' },
    ...Object.keys(COLOR_PALETTES).map((key) => ({
      value: key,
      label: capitalize(key),
    })),
  ];

  const paletteName = useWatch({
    control,
    name: `palettes.${type}.paletteName`,
  });

  const handlePaletteNameChange = useCallback(
    (name: string | null) => {
      if (!name || !Object.prototype.hasOwnProperty.call(COLOR_PALETTES, name))
        return;
      const palette = COLOR_PALETTES[name as ColorPaletteName];
      setValue(`palettes.${type}.shades`, palette);
      onShadesChange?.(palette);
    },
    [setValue, onShadesChange, type],
  );

  const handleCustomPaletteGenerate = (): void => {
    const baseColor = getValues(`palettes.${type}.customBase`);
    if (!baseColor) return;
    const newPalette = generatePalette(baseColor);
    setValue(`palettes.${type}.shades`, newPalette);
    onShadesChange?.(newPalette);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <ComboboxField.Controller
        name={`palettes.${type}.paletteName`}
        control={control}
        options={paletteOptions}
        placeholder="Choose a base palette"
        onChange={handlePaletteNameChange}
      />
      {paletteName === 'custom' && (
        <div className="flex items-end space-x-2">
          <ColorPickerField.Controller
            className="flex-1"
            control={control}
            name={`palettes.${type}.customBase`}
            label="Custom Base Color"
            placeholder="Choose a color"
          />
          <Button variant="secondary" onClick={handleCustomPaletteGenerate}>
            Generate
          </Button>
        </div>
      )}
      <div className="grid grid-cols-11 gap-4">
        {PALETTE_SHADES.map((shade) => (
          <div key={shade} className="w-14">
            <ColorPickerField.Controller
              hideText
              control={control}
              name={`palettes.${type}.shades.${shade}`}
              label={shade}
              onChange={() =>
                onShadesChange?.(getValues(`palettes.${type}.shades`))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
