// import { templateFileMetadataBaseSchema } from '@baseplate-dev/sync';
// import {
//   createTemplateFileExtractor,
//   templateConfigSchema,
// } from '@baseplate-dev/sync/extractor-v2';
// import { z } from 'zod';

// export const RawTemplateFileExtractor = createTemplateFileExtractor({
//   name: 'raw',
//   generatorTemplateMetadataSchema: templateConfigSchema.extend({
//     path: z.string().optional(),
//   }),
//   extractTemplateMetadataEntries: (files, context) =>
//     files.map((file) => ({
//       generator: file.metadata.generator,
//       templatesPath: file.metadata.path,
//       metadata: {i
//         path: file.metadata.path,
//       },
//     })),
//   writeTemplateFiles: (files, context) => {
//     //
//   },
// });
