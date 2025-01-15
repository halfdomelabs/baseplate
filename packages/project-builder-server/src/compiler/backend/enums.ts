import type {
  EnumConfig,
  ParsedProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import { prismaEnumGenerator } from '@halfdomelabs/fastify-generators';

function buildEnum(enumConfig: EnumConfig): GeneratorBundle {
  return prismaEnumGenerator({
    name: enumConfig.name,
    values: enumConfig.values.map((value) => ({
      name: value.name,
    })),
  });
}

export function buildEnumsForFeature(
  featureId: string,
  parsedProject: ParsedProjectDefinition,
): GeneratorBundle[] {
  const enums = parsedProject
    .getEnums()
    .filter((m) => m.featureRef === featureId);
  return enums.map((m) => buildEnum(m));
}
