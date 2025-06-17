// @ts-nocheck

import type { DataPipeOutput } from '%prismaUtilsImports';
import type { ServiceContext } from '%serviceContextImports';

import { BadRequestError } from '%errorHandlerServiceImports';

export interface FileUploadInput {
  id: string;
}

export async function validateFileUploadInput(
  { id }: FileUploadInput,
  category: string,
  context: ServiceContext,
  existingId?: string | null,
): Promise<DataPipeOutput<{ connect: { id: string } }>> {
  // if we're updating and not changing the ID, skip checks
  if (existingId === id) {
    return { data: { connect: { id } } };
  }

  const file = await TPL_FILE_MODEL.findUnique({
    where: { id },
  });

  // Operation must either be conducted by system
  // or the user who uploaded the file
  if (
    !file ||
    (!context.auth.roles.includes('system') &&
      file.uploaderId !== context.auth.userIdOrThrow())
  ) {
    throw new BadRequestError(`File with ID ${id} not found`);
  }

  if (file.isUsed) {
    throw new BadRequestError(`File with ID ${id} is already used elsewhere`);
  }

  if (file.category !== category) {
    throw new BadRequestError(`File with ID ${id} must match ${category}`);
  }

  return {
    data: { connect: { id } },
    operations: {
      afterPrismaPromises: [
        TPL_FILE_MODEL.update({ where: { id }, data: { isUsed: true } }),
      ],
    },
  };
}
