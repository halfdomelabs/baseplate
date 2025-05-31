import type {
  ColorPaletteName,
  PaletteShades,
  ThemeConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type {
  Control,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form';

import {
  COLOR_PALETTES,
  convertHexToOklch,
  convertOklchToHex,
  PALETTE_SHADES,
} from '@baseplate-dev/project-builder-lib';
import {
  Button,
  ColorPickerFieldController,
  ComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { capitalize } from 'inflection';
import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';

import { generatePalette } from '../theme-utils/palette-generator.js';

interface ThemePaletteEditorProps {
  control: Control<ThemeConfig>;
  getValues: UseFormGetValues<ThemeConfig>;
  setValue: UseFormSetValue<ThemeConfig>;
  onShadesChange?: (shades: Partial<PaletteShades>) => void;
  type: 'base' | 'primary';
}

export function ThemePaletteEditor({
  control,
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
    <div className="flex max-w-fit flex-col gap-4">
      <ComboboxFieldController
        name={`palettes.${type}.paletteName`}
        control={control}
        options={paletteOptions}
        placeholder="Choose a base palette"
        onChange={handlePaletteNameChange}
      />
      {paletteName === 'custom' && (
        <div className="flex max-w-xl items-center justify-between">
          <ColorPickerFieldController
            className="flex-1 space-x-1"
            wrapperClassName="items-center"
            control={control}
            name={`palettes.${type}.customBase`}
            label="Custom Base Color"
            placeholder="Choose a color"
            parseColor={convertOklchToHex}
            serializeColor={convertHexToOklch}
          />
          <Button
            variant="secondary"
            onClick={handleCustomPaletteGenerate}
            size="sm"
          >
            Generate
          </Button>
        </div>
      )}
      <div className="flex gap-3">
        {PALETTE_SHADES.map((shade) => (
          <ColorPickerFieldController
            key={shade}
            wrapperClassName="flex flex-col items-center"
            hideText
            control={control}
            name={`palettes.${type}.shades.${shade}`}
            label={shade}
            parseColor={convertOklchToHex}
            serializeColor={convertHexToOklch}
            onChange={() =>
              onShadesChange?.(getValues(`palettes.${type}.shades`))
            }
          />
        ))}
      </div>
    </div>
  );
}
