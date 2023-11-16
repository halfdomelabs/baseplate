import {
  PALETTE_SHADES,
  PaletteShades,
  ThemeConfig,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ColorPickerField,
  ComboboxField,
} from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { capitalize } from 'inflection';
import { useCallback } from 'react';
import {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { COLOR_PALETTES } from './colors';
import { generatePalette } from './palette-generator';

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
}: ThemePaletteEditorProps): JSX.Element {
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
    (name: string) => {
      if (COLOR_PALETTES[name]) {
        setValue(`palettes.${type}.shades`, COLOR_PALETTES[name]);
        onShadesChange?.(COLOR_PALETTES[name]);
      }
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
        noValueLabel="Choose a base palette"
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
