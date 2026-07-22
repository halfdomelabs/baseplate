import type { ResultOf } from '@graphql-typed-document-node/core';
import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdOutlineClear, MdUploadFile } from 'react-icons/md';
import { z } from 'zod';

import type { FragmentType } from '@src/gql';
import type { FileCategory } from '@src/gql/graphql';

import { graphql, readFragment } from '@src/gql';
import { useUpload } from '@src/hooks/use-upload';
import { formatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';
import { getApolloErrorData } from '@src/utils/apollo-error';
import { cn } from '@src/utils/cn';

import { Button } from './button';
import { CircularProgress } from './circular-progress';
import { FieldError } from './field';

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

function formatExtensions(extensions: string[]): string {
  return extensions.map((extension) => `.${extension}`).join(', ');
}

const optionalStrings = z.array(z.string()).optional();
const optionalSize = z.number().optional();

/**
 * Schemas for the data each upload validation error carries. Fields are optional
 * so an absent payload still parses and the message falls back to base wording.
 */
const UPLOAD_ERROR_SCHEMAS = {
  INVALID_FILE_TYPE: z.object({
    allowedFileExtensions: optionalStrings,
    allowedMimeTypes: optionalStrings,
  }),
  UNRECOGNIZED_FILE_TYPE: z.object({}),
  INVALID_FILE_EXTENSION: z.object({ expectedFileExtensions: optionalStrings }),
  FILE_SIZE_TOO_LARGE: z.object({ maxFileSize: optionalSize }),
  FILE_SIZE_TOO_SMALL: z.object({ minFileSize: optionalSize }),
};

/** Builds a message for an upload validation error, or null if not one. */
function formatUploadError(error: unknown): string | null {
  const result = getApolloErrorData(error, UPLOAD_ERROR_SCHEMAS);
  if (!result) return null;

  switch (result.code) {
    case 'INVALID_FILE_TYPE': {
      const { data } = result;
      if (data?.allowedFileExtensions?.length) {
        // Extensions read more clearly than MIME types.
        return `This file type is not allowed. Accepted types: ${formatExtensions(
          data.allowedFileExtensions,
        )}.`;
      }
      return data?.allowedMimeTypes?.length
        ? `This file type is not allowed. Accepted types: ${data.allowedMimeTypes.join(', ')}.`
        : 'This file type is not allowed.';
    }
    case 'UNRECOGNIZED_FILE_TYPE': {
      return 'This file type could not be recognized. Please try a different file.';
    }
    case 'INVALID_FILE_EXTENSION': {
      const { data } = result;
      return data?.expectedFileExtensions?.length
        ? `This file's extension does not match its declared file type. Expected: ${formatExtensions(
            data.expectedFileExtensions,
          )}.`
        : `This file's extension does not match its declared file type.`;
    }
    case 'FILE_SIZE_TOO_LARGE': {
      const { data } = result;
      return data?.maxFileSize
        ? `This file is too large. The maximum size is ${formatFileSize(data.maxFileSize)}.`
        : 'This file is too large.';
    }
    case 'FILE_SIZE_TOO_SMALL': {
      const { data } = result;
      return data?.minFileSize
        ? `This file is too small. The minimum size is ${formatFileSize(data.minFileSize)}.`
        : 'This file is too small.';
    }
  }
}

export const fileInputValueFragment = graphql(`
  fragment FileInput_value on File {
    id
    filename
    publicUrl
  }
`);

const fileInputCreateUploadUrlMutation = graphql(`
  mutation FileInputCreateUploadUrl($input: CreatePresignedUploadUrlInput!) {
    createPresignedUploadUrl(input: $input) {
      url
      fields {
        name
        value
      }
      method
      file {
        id
        filename
        publicUrl
        ...FileInput_value
      }
    }
  }
`);

export type FileUploadInput = ResultOf<typeof fileInputValueFragment>;

export interface FileInputProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: FileUploadInput | null) => void;
  value?: FileUploadInput | FragmentType<typeof fileInputValueFragment>;
  placeholder?: string;
  category: FileCategory;
  imagePreview?: boolean;
  /** MIME types this input accepts. Undefined accepts any type. */
  allowedMimeTypes?: string[];
  /**
   * Extensions the accepted MIME types map to (e.g. `jpg`), shown to the user in
   * place of MIME types. Falls back to MIME types when omitted.
   */
  allowedFileExtensions?: string[];
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
  allowedMimeTypes,
  allowedFileExtensions,
}: FileInputProps): ReactElement {
  const [createUploadUrl] = useMutation(fileInputCreateUploadUrlMutation);

  // react-dropzone keys `accept` by MIME type; the empty array matches any extension.
  const accept = useMemo(
    () =>
      allowedMimeTypes?.length
        ? Object.fromEntries(
            allowedMimeTypes.map((mimeType) => [mimeType, [] as string[]]),
          )
        : undefined,
    [allowedMimeTypes],
  );

  const { isUploading, error, progress, uploadFile, cancelUpload } =
    useUpload<FileUploadInput>({
      getUploadParameters: async (fileToUpload) => {
        const contentType = fileToUpload.type || 'application/octet-stream';
        const { data } = await createUploadUrl({
          variables: {
            input: {
              category,
              filename: fileToUpload.name,
              size: fileToUpload.size,
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
      onUploaded: (uploadResult) => {
        const uploadedFile = uploadResult.meta;
        if (onChange) {
          onChange({
            filename: uploadedFile.filename,
            id: uploadedFile.id,
            publicUrl: uploadedFile.publicUrl,
          });
        }
      },
      onError: (err) => {
        logError(err);
      },
      trackProgress: true,
    });

  // A picker/drop rejection never reaches the upload flow, so track it separately.
  const [dropzoneError, setDropzoneError] = useState<string | undefined>();

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      setDropzoneError(undefined);
      const file = acceptedFiles[0];
      uploadFile(file);
    },
    [uploadFile],
  );

  const onDropRejected = useCallback(() => {
    const acceptedTypes = allowedFileExtensions?.length
      ? allowedFileExtensions.map((extension) => `.${extension}`)
      : allowedMimeTypes;
    setDropzoneError(
      acceptedTypes?.length
        ? `This file type is not allowed. Accepted types: ${acceptedTypes.join(
            ', ',
          )}.`
        : 'This file cannot be uploaded.',
    );
  }, [allowedFileExtensions, allowedMimeTypes]);

  const isDraggable = !isUploading && !error && !disabled;

  const { getRootProps, getInputProps, inputRef, isDragActive, isDragReject } =
    useDropzone({
      accept,
      onDropAccepted,
      onDropRejected,
      multiple: false,
      maxFiles: 1,
      disabled: !isDraggable,
    });

  const handleRemove = (): void => {
    if (onChange) onChange(null);
    cancelUpload();
    setDropzoneError(undefined);
    if (inputRef.current as HTMLInputElement | undefined) {
      inputRef.current.value = '';
    }
  };

  const handleCancel = (): void => {
    cancelUpload();
    inputRef.current.value = '';
  };

  // Because we don't know if we're getting a fragment or a full object, we need to use the readFragment function to get the file object.
  // And because readFragment is a no-op we can safely cast the value to the fragment type.
  const file = readFragment(
    fileInputValueFragment,
    value as FragmentType<typeof fileInputValueFragment> | undefined,
  );

  // A file rejected before upload takes precedence over any prior upload error.
  const displayError =
    dropzoneError ??
    (error
      ? (formatUploadError(error) ??
        formatError(error, 'Sorry, we could not upload the file.'))
      : undefined);

  return (
    <div className={cn('max-w-md', className)}>
      {(() => {
        if (file) {
          return (
            <div
              className="flex h-12 w-full max-w-md items-center justify-between rounded-md border bg-background px-3 py-2 shadow-sm"
              role="group"
              aria-label={`Uploaded file: ${file.filename}`}
            >
              <div />
              <div className="flex items-center">
                {imagePreview && file.publicUrl && (
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Preview ${file.filename}`}
                  >
                    <img
                      src={file.publicUrl}
                      className="mr-4 h-8 w-8 rounded-lg bg-muted object-cover"
                      alt={`Preview of ${file.filename}`}
                    />
                  </a>
                )}
                <div className="text-sm font-medium">
                  {file.publicUrl ? (
                    <a
                      href={file.publicUrl}
                      className="text-foreground hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {truncateFilenameWithExtension(file.filename)}
                    </a>
                  ) : (
                    truncateFilenameWithExtension(file.filename)
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
                      size="xs"
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
      {!!displayError && <FieldError>{displayError}</FieldError>}
    </div>
  );
}
