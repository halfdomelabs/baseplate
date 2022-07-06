// @ts-nocheck

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
  onError?: (err: unknown) => void;
  trackProgress?: boolean;
}

interface UseUploadResult {
  isUploading: boolean;
  error: unknown | null;
  progress: number;
  uploadFile: (file: File) => void;
  cancelUpload: () => void;
}

interface AxiosUploadProgressEvent {
  loaded: number;
  total: number;
}

/**
 * Enables single file uploading
 */
export function useUpload<FileMetadata>({
  getUploadParameters,
  onUploaded,
  onError,
  trackProgress,
}: UseUploadOptions<FileMetadata>): UseUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [progress, setProgress] = useState(0);

  const currentAbortController = useRef<AbortController | null>(null);

  const cancelUpload = useCallback(() => {
    if (currentAbortController.current) {
      currentAbortController.current.abort();
      currentAbortController.current = null;
    }
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const abortController = new AbortController();
      try {
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

        uploadParams.fields.forEach(({ name, value }) => {
          formData.append(name, value);
        });

        formData.append('Content-Type', file.type);

        formData.append('file', file);

        const response = await axios({
          method: 'post',
          url: uploadParams.url,
          data: formData,
          signal: abortController.signal,
          onUploadProgress: trackProgress
            ? (event: AxiosUploadProgressEvent) => {
                setProgress(event.loaded / event.total);
              }
            : undefined,
        });

        if (abortController.signal.aborted) {
          return;
        }

        if (response.status === 204) {
          setIsUploading(false);
          setProgress(1);
          if (onUploaded) onUploaded({ file, meta: uploadParams.meta });
        } else {
          throw new Error(`Unexpected response: ${response.statusText}`);
        }
      } catch (err) {
        setIsUploading(false);
        if (abortController.signal.aborted) {
          return;
        }
        if (onError) onError(err);
        setError(err);
      }
    },
    [cancelUpload, getUploadParameters, onError, onUploaded, trackProgress]
  );

  return {
    isUploading,
    error,
    progress,
    uploadFile,
    cancelUpload,
  };
}
