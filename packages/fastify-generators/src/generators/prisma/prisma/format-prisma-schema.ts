import { createRequire } from 'node:module';

const internalRequire = createRequire(import.meta.url);

/**
 * The subset of the `@prisma/prisma-schema-wasm` API we rely on.
 *
 * `@prisma/prisma-schema-wasm` is a CommonJS module that loads its `.wasm`
 * binary synchronously at require time. We load it via `createRequire` rather
 * than a static import so it is never bundled.
 *
 * This is the same WASM module that `@prisma/internals`' `formatSchema` uses
 * under the hood, but it carries no dependencies and no install/build scripts,
 * so it avoids pulling `@prisma/engines` (and its pnpm approve-builds prompt)
 * into the generator tooling.
 */
interface PrismaSchemaWasm {
  format: (schema: string, params: string) => string;
}

/**
 * A single Prisma schema file represented as a `[filePath, contents]` tuple.
 */
export type PrismaSchemaTuple = [filePath: string, contents: string];

/**
 * Formats one or more Prisma schema files using the Prisma schema WASM
 * formatter, restoring Prisma's canonical column alignment.
 *
 * This mirrors the behavior of `@prisma/internals`' `formatSchema`, calling the
 * same underlying `@prisma/prisma-schema-wasm` `format` function with the same
 * default formatting options.
 *
 * @param schemas - The schema files to format, as `[filePath, contents]` tuples
 * @returns The formatted schema files in the same tuple shape
 */
export function formatPrismaSchema(
  schemas: PrismaSchemaTuple[],
): PrismaSchemaTuple[] {
  const prismaSchemaWasm = internalRequire(
    '@prisma/prisma-schema-wasm',
  ) as PrismaSchemaWasm;

  const documentFormattingParams = {
    textDocument: { uri: 'file:/dev/null' },
    options: {
      tabSize: 2,
      insertSpaces: true,
    },
  };

  const formattedRaw = prismaSchemaWasm.format(
    JSON.stringify(schemas),
    JSON.stringify(documentFormattingParams),
  );

  return JSON.parse(formattedRaw) as PrismaSchemaTuple[];
}
