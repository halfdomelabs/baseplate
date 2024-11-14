import type {
  EnumConfig,
  ParsedProjectDefinition,
} from '@halfdomelabs/project-builder-lib';

function buildEnum(enumConfig: EnumConfig): Record<string, unknown> {
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
): Record<string, unknown>[] | undefined {
  const enums = parsedProject.getEnums().filter((m) => m.feature === featureId);
  if (enums.length === 0) {
    return undefined;
  }
  return enums.map((m) => buildEnum(m));
}
