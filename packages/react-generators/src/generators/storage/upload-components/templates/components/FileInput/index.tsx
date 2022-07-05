// @ts-nocheck

import classNames from 'classnames';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Control,
  FieldError,
  FieldPath,
  get,
  useController,
} from 'react-hook-form';
import Button from '../Button';
import FormError from '../FormError';
import FormLabel from '../FormLabel';
import { useCreateUploadUrlMutation } from '%react-apollo/generated';
import { useUpload } from '%upload-components/use-upload';
import { formatError } from '%react-error/formatter';
import { reportAndLogError } from '%react-error/logger';

interface FileUploadInput {
  id: string;
  name: string;
}

interface Props {
  className?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: FileUploadInput | null) => void;
  onBlur?: () => void;
  value?: FileUploadInput;
  placeholder?: string;
  category: string;
}

const FileInput = function FileInput({
  className,
  disabled,
  name,
  onChange,
  onBlur,
  value,
  category,
  placeholder,
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
          onChange({ name: uploadedFile.name, id: uploadedFile.id });
        }
      },
      onError: (err) => {
        reportAndLogError(err);
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

  const { getRootProps, getInputProps, inputRef } = useDropzone({
    onDropAccepted,
    multiple: false,
    maxFiles: 1,
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
            <div className="flex space-x-4">
              <div className="text-lg text-black-600">{value.name}</div>
              <Button onClick={handleRemove}>Remove</Button>
            </div>
          );
        }

        if (isUploading) {
          return (
            <div className="flex space-x-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <Button onClick={handleCancel}>Cancel</Button>
            </div>
          );
        }

        if (error) {
          return (
            <div className="flex space-x-4">
              <div className="text-red-600">
                {formatError(error, 'Sorry, we could not upload the file.')}
              </div>
              <Button onClick={handleRemove}>Try Again</Button>
            </div>
          );
        }

        return (
          <div
            {...getRootProps()}
            className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer"
          >
            <input name={name} {...getInputProps()} />
            <div className="text-lg text-gray-600">
              {placeholder || 'Drag or click here to add file'}
            </div>
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
