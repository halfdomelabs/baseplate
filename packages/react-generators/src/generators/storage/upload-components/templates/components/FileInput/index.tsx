// @ts-nocheck

import classNames from 'classnames';
import { useCallback } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import { useDropzone } from 'react-dropzone';
import {
  Control,
  FieldError,
  FieldPath,
  get,
  useController,
} from 'react-hook-form';
import { MdUploadFile } from 'react-icons/md';
import Button from '../Button';
import FormError from '../FormError';
import FormLabel from '../FormLabel';
import { useCreateUploadUrlMutation } from '%react-apollo/generated';
import { useUpload } from '%upload-components/use-upload';
import { formatError } from '%react-error/formatter';
import { logError } from '%react-error/logger';

import 'react-circular-progressbar/dist/styles.css';

interface FileUploadInput {
  id: string;
  name: string;
  hostedUrl?: string | null;
}

interface Props {
  className?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: FileUploadInput | null) => void;
  value?: FileUploadInput;
  placeholder?: string;
  category: string;
  imagePreview?: boolean;
}

const FileInput = function FileInput({
  className,
  disabled,
  name,
  onChange,
  value,
  category,
  placeholder,
  imagePreview,
}: Props): JSX.Element {
  const [createUploadUrl] = useCreateUploadUrlMutation();

  const { isUploading, error, progress, uploadFile, cancelUpload } =
    useUpload<FileUploadInput>({
      getUploadParameters: async (fileToUpload) => {
        const contentType = fileToUpload.type || 'application/octet-stream';
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
        return { url, fields: fields || [], method, meta: file };
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
    [uploadFile]
  );

  const isDraggable = !isUploading && !error && !disabled;

  const { getRootProps, getInputProps, inputRef, isDragActive } = useDropzone({
    onDropAccepted,
    multiple: false,
    maxFiles: 1,
    disabled: !isDraggable,
  });

  const handleRemove = (): void => {
    if (onChange) onChange(null);
    cancelUpload();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleCancel = (): void => {
    cancelUpload();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={classNames('max-w-md', className)}>
      {(() => {
        if (value) {
          return (
            <div className="flex h-32 w-full max-w-sm flex-row items-center justify-center rounded-lg border bg-white p-4 shadow-md">
              {imagePreview && value.hostedUrl && (
                <a href={value.hostedUrl} target="_blank" rel="noreferrer">
                  <img
                    src={value.hostedUrl}
                    className="mr-4 h-24 w-32 rounded-lg bg-gray-300 object-cover"
                    alt={`${value.name} upload`}
                  />
                </a>
              )}
              <div className="flex flex-col space-y-4">
                <div className="text-lg font-medium">
                  {value.hostedUrl ? (
                    <a
                      href={value.hostedUrl}
                      className="text-gray-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {value.name}
                    </a>
                  ) : (
                    value.name
                  )}
                </div>
                <Button color="light" size="small" onClick={handleRemove}>
                  Remove
                </Button>
              </div>
            </div>
          );
        }

        const uploadPercentage = Math.round(progress * 100);

        return (
          <div
            {...getRootProps()}
            className={classNames(
              'flex h-32 w-full max-w-sm items-center justify-center rounded-md border-2 border-dashed px-4',
              isDragActive
                ? 'border-blue-300 text-blue-600'
                : 'border-gray-300 text-gray-600',
              { 'opacity-50': disabled, 'cursor-pointer': isDraggable }
            )}
          >
            {(() => {
              if (isUploading) {
                return (
                  <div className="flex flex-col items-center space-y-2">
                    <CircularProgressbar
                      value={uploadPercentage}
                      text={`${uploadPercentage}%`}
                      className="h-12 w-12"
                    />
                    <Button
                      onClick={handleCancel}
                      color="red"
                      size="small"
                      disabled={disabled}
                    >
                      Cancel
                    </Button>
                  </div>
                );
              }
              if (error) {
                return (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-center text-red-600">
                      {formatError(
                        error,
                        'Sorry, we could not upload the file.'
                      )}
                    </div>
                    <Button
                      size="small"
                      onClick={handleRemove}
                      disabled={disabled}
                    >
                      Retry
                    </Button>
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center space-y-2">
                  <input
                    name={name}
                    {...getInputProps()}
                    disabled={isDraggable}
                  />
                  <MdUploadFile className="h-12 w-12" />
                  <div className="text-lg font-medium">
                    {placeholder || 'Select a file to upload'}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
};

interface FileInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

FileInput.Labelled = function FileInputLabelled({
  label,
  className,
  error,
  ...rest
}: FileInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <div className={classNames('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <FileInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </div>
  );
};

interface FileInputControllerProps<T> extends FileInputLabelledProps {
  control: Control<T>;
  name: FieldPath<T>;
}

FileInput.LabelledController = function FileInputController<T>({
  control,
  name,
  ...rest
}: FileInputControllerProps<T>): JSX.Element {
  const {
    field: { value, onChange },
    formState: { errors },
  } = useController({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  // TODO: Validate value is correct type
  const validatedValue = (value as FileUploadInput)?.id
    ? (value as FileUploadInput)
    : undefined;

  return (
    <FileInput.Labelled
      onChange={(newValue) => onChange(newValue)}
      value={validatedValue}
      error={error?.message}
      {...rest}
    />
  );
};

export default FileInput;
