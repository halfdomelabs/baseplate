import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useController } from 'react-hook-form';
import { MdClose } from 'react-icons/md';

import { CURATED_ICONS, ICON_MAP } from './curated-icons.js';

interface IconPickerFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

function IconPickerField({
  label,
  description,
  error,
  value,
  onChange,
}: IconPickerFieldProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [open, setOpen] = useState(false);

  const SelectedIcon = value ? ICON_MAP.get(value) : undefined;

  const filtered =
    search.length > 0
      ? CURATED_ICONS.filter((i) =>
          i.name.toLowerCase().includes(search.toLowerCase()),
        )
      : CURATED_ICONS;

  return (
    <Field data-invalid={!!error}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div className="flex items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative w-full">
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 w-full justify-start pr-8"
                />
              }
            >
              {SelectedIcon ? (
                <span className="flex items-center gap-2">
                  <SelectedIcon className="size-4" />
                  <span className="text-sm">{value}</span>
                </span>
              ) : value ? (
                <span className="text-sm">{value}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Select an icon
                </span>
              )}
            </PopoverTrigger>
            {value ? (
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(null);
                }}
              >
                <MdClose className="size-4" />
              </button>
            ) : null}
          </div>
          <PopoverContent align="start" className="w-80 p-3">
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="mb-2"
            />
            <TooltipProvider>
              <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                {filtered.map((item) => (
                  <Tooltip key={item.name}>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className={`flex size-8 items-center justify-center rounded-md hover:bg-accent ${value === item.name ? 'bg-accent ring-1 ring-ring' : ''}`}
                          onClick={() => {
                            onChange?.(item.name);
                            setOpen(false);
                            setSearch('');
                          }}
                        />
                      }
                    >
                      <item.icon className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>{item.name}</TooltipContent>
                  </Tooltip>
                ))}
                {filtered.length === 0 ? (
                  <p className="col-span-8 py-4 text-center text-sm text-muted-foreground">
                    No icons found
                  </p>
                ) : null}
              </div>
            </TooltipProvider>
            <div className="mt-2 border-t pt-2">
              <p className="mb-1 text-xs text-muted-foreground">
                Or enter a custom name from{' '}
                <a
                  href="https://react-icons.github.io/react-icons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  react-icons
                </a>
                :
              </p>
              <div className="flex gap-1">
                <Input
                  placeholder="e.g. MdPeople"
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customValue) {
                      e.preventDefault();
                      onChange?.(customValue);
                      setCustomValue('');
                      setOpen(false);
                    }
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 shrink-0"
                  type="button"
                  disabled={!customValue}
                  onClick={() => {
                    onChange?.(customValue);
                    setCustomValue('');
                    setOpen(false);
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

interface ReactIconComboboxControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<IconPickerFieldProps, 'value' | 'onChange' | 'error'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ReactIconComboboxController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: ReactIconComboboxControllerProps<
  TFieldValues,
  TFieldName
>): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <IconPickerField
      error={error?.message}
      {...rest}
      value={(field.value as string | null) ?? null}
      onChange={(val) => {
        field.onChange(val ?? '');
      }}
    />
  );
}

export { ReactIconComboboxController };
