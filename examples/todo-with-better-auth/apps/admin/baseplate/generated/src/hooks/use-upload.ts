import axios from 'axios';
import { useCallback, useRef, useState } from 'react';

interface UploadParams<FileMetadata = never> {
  url: string;
  fields: { name: string; value: string }[];
  method: string;
  meta: FileMetadata;
}

interface UploadedFile<FileMetadata = never> {
  file: File;
  meta: FileMetadata;
}

interface UseUploadOptions<FileMetadata = never> {
  getUploadParameters: (file: File) => Promise<UploadParams<FileMetadata>>;
  onUploaded?: (file: UploadedFile<FileMetadata>) => void;
  onError?: (error: unknown) => void;
  trackProgress?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface UseUploadResult {
  isUploading: boolean;
  error: unknown;
  progress: number;
  uploadFile: (file: File) => void;
  cancelUpload: () => void;
  reset: () => void;
}

/**
 * Enables single file uploading
 */
export function useUpload<FileMetadata>({
  getUploadParameters,
  onUploaded,
  onError,
  trackProgress,
  maxFileSize,
  allowedTypes,
}: UseUploadOptions<FileMetadata>): UseUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [progress, setProgress] = useState(0);

  const currentAbortController = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsUploading(false);
  }, []);

  const cancelUpload = useCallback(() => {
    if (currentAbortController.current) {
      currentAbortController.current.abort();
      currentAbortController.current = null;
    }
    reset();
  }, [reset]);

  const uploadFile = useCallback(
    (file: File) => {
      // Validate file size
      if (maxFileSize && file.size > maxFileSize) {
        const error = new Error(
          `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        );
        setError(error);
        if (onError) onError(error);
        return;
      }

      // Validate file type
      if (
        allowedTypes &&
        allowedTypes.length > 0 &&
        !allowedTypes.includes(file.type)
      ) {
        const error = new Error(`File type '${file.type}' is not allowed`);
        setError(error);
        if (onError) onError(error);
        return;
      }

      const abortController = new AbortController();

      const upload = async (): Promise<void> => {
        cancelUpload();
        currentAbortController.current = abortController;

        setIsUploading(true);
        setError(null);
        setProgress(0);

        const uploadParams = await getUploadParameters(file);

        if (uploadParams.method !== 'POST') {
          throw new Error(`Unsupported method: ${uploadParams.method}`);
        }

        const formData = new FormData();

        for (const { name, value } of uploadParams.fields) {
          formData.append(name, value);
        }

        if (
          !uploadParams.fields.some(
            ({ name }) => name.toLowerCase() === 'content-type',
          )
        ) {
          formData.append('Content-Type', file.type);
        }

        formData.append('file', file);

        const response = await axios({
          method: 'post',
          url: uploadParams.url,
          data: formData,
          signal: abortController.signal,
          onUploadProgress: trackProgress
            ? (event) => {
                if (event.progress !== undefined) {
                  setProgress(Math.min(event.progress, 1));
                }
              }
            : undefined,
        });

        if (abortController.signal.aborted) {
          return;
        }

        if (response.status === 204 || response.status === 200) {
          setIsUploading(false);
          setProgress(1);
          if (onUploaded) onUploaded({ file, meta: uploadParams.meta });
        } else {
          throw new Error(
            `Upload failed with status ${response.status}: ${response.statusText}`,
          );
        }
      };

      upload().catch((error: unknown) => {
        setIsUploading(false);
        if (abortController.signal.aborted) {
          return;
        }
        if (onError) onError(error);
        setError(error);
      });
    },
    [
      cancelUpload,
      getUploadParameters,
      onError,
      onUploaded,
      trackProgress,
      maxFileSize,
      allowedTypes,
    ],
  );

  return {
    isUploading,
    error,
    progress,
    uploadFile,
    cancelUpload,
    reset,
  };
}
