import type {
  PaletteShades,
  ThemeConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form';

import {
  convertHexToOklch,
  convertOklchToHex,
} from '@baseplate-dev/project-builder-lib';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { clsx } from 'clsx';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useController } from 'react-hook-form';
import { MdInfo, MdRestartAlt } from 'react-icons/md';

interface PaletteSwatchRowProps {
  label: string;
  shades: PaletteShades;
  currentValue: string | undefined;
  onSelect: (oklch: string) => void;
}

function PaletteSwatchRow({
  label,
  shades,
  currentValue,
  onSelect,
}: PaletteSwatchRowProps): React.JSX.Element {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex gap-1">
        {Object.entries(shades).map(([shade, oklch]) => (
          <button
            key={shade}
            type="button"
            className={clsx(
              'h-6 w-6 rounded-sm border transition-transform hover:scale-110',
              currentValue === oklch
                ? 'border-foreground ring-1 ring-foreground'
                : 'border-border',
            )}
            style={{ backgroundColor: convertOklchToHex(oklch) }}
            title={shade}
            onClick={() => {
              onSelect(oklch);
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ThemeColorPickerProps {
  control: Control<ThemeConfig>;
  name: FieldPath<ThemeConfig>;
  label: string;
  description: string;
  currentValue: string | undefined;
  defaultValue: string | undefined;
  baseShades: PaletteShades;
  primaryShades: PaletteShades;
  setValue: UseFormSetValue<ThemeConfig>;
  formatColorName: (color: string) => string;
}

/**
 * Color picker for theme colors with tabbed palette/custom selection.
 *
 * The popover contains two tabs:
 * - "Palette" — clickable shade swatches for base and primary palettes
 * - "Custom" — hex color input and color wheel picker
 */
export function ThemeColorPicker({
  control,
  name,
  label,
  description,
  currentValue,
  defaultValue,
  baseShades,
  primaryShades,
  setValue,
  formatColorName,
}: ThemeColorPickerProps): React.JSX.Element {
  const { field } = useController({ control, name });
  const hexValue = currentValue ? convertOklchToHex(currentValue) : undefined;

  const handleHexChange = (newHex: string): void => {
    if (!newHex) return;
    field.onChange(convertHexToOklch(newHex));
  };

  const handleSwatchSelect = (oklch: string): void => {
    setValue(name, oklch);
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex h-6 w-full items-center gap-1">
          <div className="text-sm font-medium">{label}</div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Color Info"
                  className="opacity-30"
                />
              }
            >
              <MdInfo />
            </TooltipTrigger>
            <TooltipContent
              align="start"
              side="bottom"
              className="max-w-[400px]"
            >
              <div className="font-normal">{description}</div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Popover>
          <PopoverTrigger className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2 text-sm hover:bg-accent">
            {hexValue && (
              <div
                className="h-4 w-6 rounded-sm border border-border"
                style={{ backgroundColor: hexValue }}
              />
            )}
            <div className="truncate">
              {currentValue ? formatColorName(currentValue) : 'Select color'}
            </div>
          </PopoverTrigger>
          <PopoverContent
            sideOffset={5}
            align="start"
            className="w-auto rounded-md border border-border bg-background p-3"
          >
            <Tabs defaultValue="palette">
              <TabsList className="mb-2 w-full">
                <TabsTrigger value="palette" className="flex-1">
                  Palette
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">
                  Custom
                </TabsTrigger>
              </TabsList>
              <TabsContent value="palette" className="space-y-2">
                <PaletteSwatchRow
                  label="Base"
                  shades={baseShades}
                  currentValue={currentValue}
                  onSelect={handleSwatchSelect}
                />
                <PaletteSwatchRow
                  label="Primary"
                  shades={primaryShades}
                  currentValue={currentValue}
                  onSelect={handleSwatchSelect}
                />
                {defaultValue && currentValue !== defaultValue && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleSwatchSelect(defaultValue);
                    }}
                  >
                    <MdRestartAlt />
                    Reset to {formatColorName(defaultValue)}
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="custom" className="space-y-2">
                <HexColorInput
                  className="w-full rounded-md border border-input bg-background p-2 text-sm"
                  prefixed
                  color={hexValue ?? ''}
                  onChange={handleHexChange}
                />
                <HexColorPicker
                  color={hexValue ?? ''}
                  onChange={handleHexChange}
                />
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
