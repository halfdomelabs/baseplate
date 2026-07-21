import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useController } from 'react-hook-form';

import { isValidMimeType, MIME_TYPE_GROUPS } from '../mime-type-presets.js';

interface AllowedMimeTypesFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TFieldName;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Edits the list of MIME types a file category accepts.
 *
 * The chip list is the single source of truth. The group buttons are shortcuts
 * that append their MIME types to it, so there is no toggle state that can drift
 * out of sync with the list. An empty list means the category accepts any file
 * type.
 */
export function AllowedMimeTypesField<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label = 'Allowed File Types',
  description = 'Leave empty to allow all file types.',
}: AllowedMimeTypesFieldProps<TFieldValues, TFieldName>): React.JSX.Element {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });

  const [customMimeType, setCustomMimeType] = useState('');
  const [customError, setCustomError] = useState<string | undefined>();

  // Undefined for categories created before allowed MIME types were supported.
  const mimeTypes = (value as string[] | undefined) ?? [];

  function setMimeTypes(newMimeTypes: string[]): void {
    onChange([...new Set(newMimeTypes)].toSorted());
  }

  function handleAddGroup(groupMimeTypes: string[]): void {
    setMimeTypes([...mimeTypes, ...groupMimeTypes]);
  }

  function handleRemove(mimeType: string): void {
    setMimeTypes(mimeTypes.filter((m) => m !== mimeType));
  }

  function handleClearAll(): void {
    setMimeTypes([]);
  }

  function handleAddCustom(): void {
    const trimmed = customMimeType.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidMimeType(trimmed)) {
      setCustomError(`"${trimmed}" is not a valid MIME type (e.g. image/png).`);
      return;
    }
    if (mimeTypes.includes(trimmed)) {
      setCustomError(`"${trimmed}" has already been added.`);
      return;
    }
    setMimeTypes([...mimeTypes, trimmed]);
    setCustomMimeType('');
    setCustomError(undefined);
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
      <div className="storage:space-y-3">
        <div className="storage:flex storage:flex-wrap storage:items-center storage:gap-2">
          <span className="storage:text-sm storage:text-muted-foreground">
            Add a group:
          </span>
          {MIME_TYPE_GROUPS.map((group) => (
            <Button
              key={group.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleAddGroup(group.mimeTypes);
              }}
            >
              + {group.label}
            </Button>
          ))}
        </div>
        <div className="storage:flex storage:items-start storage:gap-2">
          <div className="storage:flex-1">
            <Input
              value={customMimeType}
              placeholder="e.g. application/zip"
              aria-label="Custom MIME type"
              onChange={(event) => {
                setCustomMimeType(event.target.value);
                setCustomError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddCustom();
                }
              }}
            />
            {customError ? (
              <p className="storage:mt-1 storage:text-sm storage:text-destructive">
                {customError}
              </p>
            ) : (
              <p className="storage:mt-1 storage:text-sm storage:text-muted-foreground">
                Must be a standard MIME type, e.g. application/zip.
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              handleAddCustom();
            }}
          >
            Add
          </Button>
        </div>
        {mimeTypes.length > 0 ? (
          <div className="storage:space-y-2">
            <div className="storage:flex storage:flex-wrap storage:gap-2">
              {mimeTypes.map((mimeType) => (
                <Badge key={mimeType} variant="secondary">
                  {mimeType}
                  <button
                    type="button"
                    className="storage:ml-1 storage:text-muted-foreground storage:hover:text-foreground"
                    aria-label={`Remove ${mimeType}`}
                    onClick={() => {
                      handleRemove(mimeType);
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="storage:h-auto storage:p-0"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </div>
        ) : (
          <p className="storage:text-sm storage:text-muted-foreground">
            All file types are currently allowed.
          </p>
        )}
      </div>
      {error?.message ? <FieldError>{error.message}</FieldError> : null}
    </Field>
  );
}
