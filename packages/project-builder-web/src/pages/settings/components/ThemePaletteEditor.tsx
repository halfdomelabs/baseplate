import {
  COLOR_PALETTES,
  ColorPaletteName,
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
    (name: ColorPaletteName) => {
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
        className="max-w-xl"
        control={control}
        options={paletteOptions}
        placeholder="Choose a base palette"
        onChange={handlePaletteNameChange}
      />
      {paletteName === 'custom' && (
        <div className="flex max-w-xl items-center justify-between">
          <ColorPickerField.Controller
            className="flex-1 space-x-1"
            wrapperClassName="items-center"
            control={control}
            name={`palettes.${type}.customBase`}
            label="Custom Base Color"
            placeholder="Choose a color"
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
          <ColorPickerField.Controller
            key={shade}
            wrapperClassName="flex flex-col items-center"
            hideText
            control={control}
            name={`palettes.${type}.shades.${shade}`}
            label={shade}
            onChange={() =>
              onShadesChange?.(getValues(`palettes.${type}.shades`))
            }
          />
        ))}
      </div>
    </div>
  );
}
