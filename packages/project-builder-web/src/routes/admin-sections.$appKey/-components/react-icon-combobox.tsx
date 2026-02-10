import type { ComboboxFieldProps } from '@baseplate-dev/ui-components';
import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { IconType } from 'react-icons/lib';

import {
  AsyncComboboxField,
  useControllerMerged,
} from '@baseplate-dev/ui-components';
import { compareStrings } from '@baseplate-dev/utils';

interface IconOption {
  label: string;
  value: string;
  icon: IconType;
}

type ReactIconComboboxProps = Omit<
  ComboboxFieldProps<IconOption>,
  'options' | 'renderText'
>;

async function fetchIcons(): Promise<IconOption[]> {
  const hiIcons = await import('react-icons/hi');
  const faIcons = await import('react-icons/fa');
  const mdIcons = await import('react-icons/md');
  const bsIcons = await import('react-icons/bs');

  const icons = [hiIcons, faIcons, mdIcons, bsIcons].map((icons) =>
    Object.entries(icons)
      .filter(([, value]) => typeof value === 'function')
      .map(([key, value]) => ({
        label: key,
        value: key,
        icon: value as IconType,
      })),
  );

  return icons.flat();
}

function ReactIconCombobox({
  ...rest
}: ReactIconComboboxProps): React.ReactElement {
  return (
    <AsyncComboboxField
      placeholder="Select an icon"
      {...rest}
      loadOptions={(query) =>
        fetchIcons().then((options) =>
          options
            .filter(
              (option) =>
                !query ||
                option.label.toLowerCase().includes(query.toLowerCase()),
            )
            .toSorted((a, b) => compareStrings(a.label, b.label))
            .slice(0, 20),
        )
      }
      renderItemLabel={(option) => (
        <div className="flex items-center gap-2">
          <option.icon className="size-4" />
          {option.label}
        </div>
      )}
    />
  );
}

interface ReactIconComboboxControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ReactIconComboboxProps, 'value'> {
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
  } = useControllerMerged({ name, control }, rest);

  const restProps = rest;

  return (
    <ReactIconCombobox
      error={error?.message}
      {...restProps}
      {...field}
      value={field.value ?? null}
    />
  );
}

export { ReactIconComboboxController };
