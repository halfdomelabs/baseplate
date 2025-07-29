import type { GeneratorEntry, GeneratorOutput } from '@baseplate-dev/sync';

import {
  buildGeneratorEntry,
  deleteMetadataFiles,
  executeGeneratorEntry,
  writeGeneratorOutput,
  writeTemplateInfoFiles,
} from '@baseplate-dev/sync';

import { writeGeneratorSteps } from './generator-steps-writer.js';
import { getPreviousGeneratedPayload } from './get-previous-generated-payload.js';

export interface GeneratorOperations {
  buildGeneratorEntry: typeof buildGeneratorEntry;
  executeGeneratorEntry: typeof executeGeneratorEntry;
  getPreviousGeneratedPayload: typeof getPreviousGeneratedPayload;
  writeGeneratorOutput: typeof writeGeneratorOutput;
  writeMetadata: (
    project: GeneratorEntry,
    output: GeneratorOutput,
    projectDirectory: string,
  ) => Promise<void>;
  writeGeneratorSteps: typeof writeGeneratorSteps;
}

export const DEFAULT_GENERATOR_OPERATIONS: GeneratorOperations = {
  buildGeneratorEntry,
  executeGeneratorEntry,
  getPreviousGeneratedPayload,
  writeGeneratorOutput,
  writeMetadata: async (_project, output, projectDirectory) => {
    await deleteMetadataFiles(projectDirectory);
    await writeTemplateInfoFiles(output.files, projectDirectory);
  },
  writeGeneratorSteps,
};
