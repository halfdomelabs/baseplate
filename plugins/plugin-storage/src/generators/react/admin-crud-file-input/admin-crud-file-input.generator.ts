import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import { adminCrudInputContainerProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import mime from 'mime-types';
import { z } from 'zod';

import { uploadComponentsImportsProvider } from '../upload-components/index.js';

/**
 * Overrides for MIME types whose canonical extension from `mime-types` is not
 * the one people recognize (e.g. QuickTime is `.mov`, not `.qt`).
 *
 * Keep in sync with the same map in the generated storage module's `mime.ts`.
 */
const PREFERRED_EXTENSIONS: Record<string, string> = {
  'video/quicktime': 'mov',
};

/**
 * Maps MIME types to one familiar extension each (e.g. `image/jpeg` → `jpeg`).
 * Uses the same `mime-types` version as the generated backend so the displayed
 * extensions match what the server accepts.
 */
function getExtensionsForMimeTypes(mimeTypes: string[]): string[] {
  const extensions = new Set<string>();
  for (const mimeType of mimeTypes) {
    const extension =
      PREFERRED_EXTENSIONS[mimeType] ?? mime.extension(mimeType);
    if (extension) {
      extensions.add(extension);
    }
  }
  return [...extensions].toSorted();
}

/** Renders a list of strings as a TypeScript array literal fragment. */
function toArrayLiteralFragment(values: string[]): TsCodeFragment {
  return tsCodeFragment(`[${values.map(quot).join(', ')}]`);
}

const descriptorSchema = z.object({
  order: z.number(),
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  isOptional: z.boolean().optional(),
  category: z.string().min(1),
  allowedMimeTypes: z.array(z.string()).optional(),
});

export const adminCrudFileInputGenerator = createGenerator({
  name: 'react/admin-crud-file-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelRelation,
  buildTasks: ({
    order,
    label,
    modelRelation,
    isOptional,
    category,
    allowedMimeTypes,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        uploadComponentsImports: uploadComponentsImportsProvider,
      },
      run({ adminCrudInputContainer, uploadComponentsImports }) {
        const allowedFileExtensions = allowedMimeTypes?.length
          ? getExtensionsForMimeTypes(allowedMimeTypes)
          : [];

        adminCrudInputContainer.addInput({
          order,
          content: TsCodeUtils.mergeFragmentsAsJsxElement(
            'FileInputFieldController',
            {
              label,
              category,
              // Omitted when empty so the input allows all types.
              allowedMimeTypes: allowedMimeTypes?.length
                ? toArrayLiteralFragment(allowedMimeTypes.toSorted())
                : undefined,
              allowedFileExtensions:
                allowedFileExtensions.length > 0
                  ? toArrayLiteralFragment(allowedFileExtensions)
                  : undefined,
              control: tsCodeFragment('control'),
              name: modelRelation,
            },
            uploadComponentsImports.FileInputFieldController.declaration(),
          ),
          graphQLFields: [
            {
              name: modelRelation,
              fields: [{ name: 'id' }, { name: 'filename' }],
            },
          ],
          validation: [
            {
              key: modelRelation,
              expression: tsCodeFragment(
                `z.object({ id: z.string(), name: z.string().nullish() })${
                  isOptional ? '.nullish()' : ''
                }`,
              ),
            },
          ],
        });

        return {};
      },
    }),
  }),
});
