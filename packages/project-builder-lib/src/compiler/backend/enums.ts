import { ParsedProjectConfig } from '@src/parser/index.js';
import { EnumConfig } from '@src/schema/models/enums.js';

function buildEnum(enumConfig: EnumConfig): unknown {
  return {
    name: enumConfig.name,
    generator: '@halfdomelabs/fastify/prisma/prisma-enum',
    values: enumConfig.values.map((value) => ({
      name: value.name,
    })),
  };
}

export function buildEnumsForFeature(
  feature: string,
  parsedProject: ParsedProjectConfig,
): unknown {
  const enums =
    parsedProject.getEnums().filter((m) => m.feature === feature) ?? [];
  if (!enums.length) {
    return undefined;
  }
  return enums.map((m) => buildEnum(m));
}
