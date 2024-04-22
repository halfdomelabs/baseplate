import {
  ParsedProjectDefinition,
  EnumConfig,
} from '@halfdomelabs/project-builder-lib';

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
  featureId: string,
  parsedProject: ParsedProjectDefinition,
): unknown {
  const enums =
    parsedProject.getEnums().filter((m) => m.feature === featureId) ?? [];
  if (!enums.length) {
    return undefined;
  }
  return enums.map((m) => buildEnum(m));
}
