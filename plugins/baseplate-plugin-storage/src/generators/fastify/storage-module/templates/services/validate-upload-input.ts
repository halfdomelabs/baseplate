// @ts-nocheck

import { DataPipeOutput } from '%prisma-utils/dataPipes';
import { BadRequestError } from '%http-errors';
import { ServiceContext } from '%service-context';

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

  const file = await prisma.file.findUnique({
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
        prisma.file.update({ where: { id }, data: { isUsed: true } }),
      ],
    },
  };
}
