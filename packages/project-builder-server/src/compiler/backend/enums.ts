import type {
  EnumConfig,
  ProjectDefinition,
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
  projectDefinition: ProjectDefinition,
): GeneratorBundle[] {
  const enums = (projectDefinition.enums ?? []).filter(
    (m) => m.featureRef === featureId,
  );
  return enums.map((m) => buildEnum(m));
}
