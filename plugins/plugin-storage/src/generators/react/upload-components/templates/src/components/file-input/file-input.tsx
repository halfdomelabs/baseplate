// @ts-nocheck

import type { ReactElement } from 'react';

import { useCreateUploadUrlMutation } from '%generatedGraphqlImports';
import {
  Button,
  CircularProgress,
  cn,
  FormMessage,
} from '%reactComponentsImports';
import { formatError, logError } from '%reactErrorImports';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdOutlineClear, MdUploadFile } from 'react-icons/md';

import { useUpload } from '../../hooks/use-upload.js';

export interface FileUploadInput {
  id: string;
  name: string;
  hostedUrl?: string | null;
}

export interface FileInputProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: FileUploadInput | null) => void;
  value?: FileUploadInput;
  placeholder?: string;
  category: string;
  imagePreview?: boolean;
  accept?: Record<string, string[]>;
}

function truncateFilenameWithExtension(filename: string, length = 20): string {
  if (filename.length < length) {
    return filename;
  }
  const extension = filename.includes('.')
    ? (filename.split('.').pop()?.slice(0, 5) ?? '')
    : '';
  const truncatedFilename = filename.slice(0, length - extension.length - 1);
  return `${truncatedFilename}...${extension}`;
}

export function FileInput({
  className,
  disabled,
  name,
  onChange,
  value,
  category,
  placeholder,
  imagePreview,
  accept,
}: FileInputProps): ReactElement {
  const [createUploadUrl] = useCreateUploadUrlMutation();

  const { isUploading, error, progress, uploadFile, cancelUpload } =
    useUpload<FileUploadInput>({
      getUploadParameters: async (fileToUpload) => {
        const contentType = fileToUpload.type;
        const { data } = await createUploadUrl({
          variables: {
            input: {
              category,
              fileName: fileToUpload.name,
              fileSize: fileToUpload.size,
              // TODO: Figure out what to do if type is blank
              contentType,
            },
          },
        });
        if (!data) {
          throw new Error(`Could not create upload url`);
        }
        const {
          createPresignedUploadUrl: { url, fields, method, file },
        } = data;
        return { url, fields: fields ?? [], method, meta: file };
      },
      onUploaded: (file) => {
        const uploadedFile = file.meta;
        if (onChange) {
          onChange({
            name: uploadedFile.name,
            id: uploadedFile.id,
            hostedUrl: uploadedFile.hostedUrl,
          });
        }
      },
      onError: (err) => {
        logError(err);
      },
      trackProgress: true,
    });

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      uploadFile(file);
    },
    [uploadFile],
  );

  const isDraggable = !isUploading && !error && !disabled;

  const { getRootProps, getInputProps, inputRef, isDragActive, isDragReject } =
    useDropzone({
      accept,
      onDropAccepted,
      multiple: false,
      maxFiles: 1,
      disabled: !isDraggable,
    });

  const handleRemove = (): void => {
    if (onChange) onChange(null);
    cancelUpload();
    inputRef.current.value = '';
  };

  const handleCancel = (): void => {
    cancelUpload();
    inputRef.current.value = '';
  };

  return (
    <div className={cn('max-w-md', className)}>
      {(() => {
        if (value) {
          return (
            <div
              className="flex h-12 w-full max-w-md items-center justify-between rounded-md border bg-background px-3 py-2 shadow-sm"
              role="group"
              aria-label={`Uploaded file: ${value.name}`}
            >
              <div />
              <div className="flex items-center">
                {imagePreview && value.hostedUrl && (
                  <a
                    href={value.hostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Preview ${value.name}`}
                  >
                    <img
                      src={value.hostedUrl}
                      className="mr-4 h-8 w-8 rounded-lg bg-muted object-cover"
                      alt={`Preview of ${value.name}`}
                    />
                  </a>
                )}
                <div className="text-sm font-medium">
                  {value.hostedUrl ? (
                    <a
                      href={value.hostedUrl}
                      className="text-foreground hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {truncateFilenameWithExtension(value.name)}
                    </a>
                  ) : (
                    truncateFilenameWithExtension(value.name)
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemove}>
                <MdOutlineClear
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  aria-hidden="true"
                />
              </Button>
            </div>
          );
        }

        const uploadPercentage = Math.round(progress * 100);

        return (
          <div
            {...getRootProps()}
            className={cn(
              'flex h-12 w-full max-w-md items-center justify-center rounded-md border-2 border-dashed px-4 py-2 transition-colors duration-200',
              isDragActive && !isDragReject
                ? 'border-primary/50 bg-primary/5 text-primary'
                : isDragReject
                  ? 'border-destructive/50 bg-destructive/5 text-destructive'
                  : 'border-input text-muted-foreground hover:border-primary/30 hover:bg-accent/5',
              disabled && 'cursor-not-allowed opacity-50',
              isDraggable && 'cursor-pointer',
            )}
          >
            {(() => {
              if (isUploading) {
                return (
                  <div className="flex items-center space-x-4">
                    <CircularProgress
                      value={uploadPercentage}
                      max={100}
                      min={0}
                      gaugePrimaryColor="var(--primary)"
                      gaugeSecondaryColor="var(--muted)"
                      size="sm"
                      className="h-8 w-8"
                    />
                    <Button
                      variant="linkDestructive"
                      onClick={handleCancel}
                      disabled={disabled}
                      aria-label="Cancel upload"
                    >
                      Cancel
                    </Button>
                  </div>
                );
              }
              if (error) {
                return (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="link"
                      onClick={handleRemove}
                      disabled={disabled}
                    >
                      Retry
                    </Button>
                  </div>
                );
              }
              return (
                <div className="flex items-center space-x-2">
                  <input
                    name={name}
                    {...getInputProps()}
                    disabled={!isDraggable}
                    aria-label={placeholder ?? 'Select a file'}
                  />
                  <MdUploadFile className="h-6 w-6" aria-hidden="true" />
                  <div className="text-sm font-medium">
                    {isDragActive && !isDragReject
                      ? 'Drop file here'
                      : isDragReject
                        ? 'File type not supported'
                        : (placeholder ?? 'Select a file or drag and drop')}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}
      {!!error && (
        <FormMessage>
          {formatError(error, 'Sorry, we could not upload the file.')}
        </FormMessage>
      )}
    </div>
  );
}
