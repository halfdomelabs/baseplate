import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';

import type { ScalarFieldType } from '@src/types/field-types.js';

import type {
  PothosCustomScalarConfig,
  PothosScalarConfig,
} from './scalars.js';

import { INBUILT_POTHOS_SCALARS } from './scalars.js';

export interface PothosTypeReference {
  typeName: string;
  exportName: string;
  moduleName: string;
}

export function getExpressionFromPothosTypeReference(
  ref: PothosTypeReference,
): TypescriptCodeExpression {
  return TypescriptCodeUtils.createExpression(
    ref.exportName,
    `import { ${ref.exportName} } from '${ref.moduleName}';`,
  );
}

// TODO: Make immutable / freezable
function safeMergeMap<K, V>(
  map1: Map<K, V>,
  map2: Map<K, V> | [K, V][],
): Map<K, V> {
  const result = new Map<K, V>(map1);

  for (const [key, value] of map2) {
    if (result.has(key)) {
      throw new Error(`Duplicate key found during merge: ${String(key)}`);
    }
    result.set(key, value);
  }

  return result;
}

export class PothosTypeReferenceContainer {
  public constructor(
    protected customScalars: Map<
      ScalarFieldType,
      PothosCustomScalarConfig
    > = new Map(),
    protected pothosEnums: Map<string, PothosTypeReference> = new Map(),
    protected inputTypes: Map<string, PothosTypeReference> = new Map(),
    protected objectTypes: Map<string, PothosTypeReference> = new Map(),
  ) {}

  public addCustomScalar(config: PothosCustomScalarConfig): void {
    if (this.customScalars.has(config.scalar)) {
      throw new Error(
        `Custom scalar ${config.scalar} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.customScalars.set(config.scalar, config);
  }

  public addPothosEnum(config: PothosTypeReference): void {
    if (this.pothosEnums.has(config.typeName)) {
      throw new Error(
        `Enum ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.pothosEnums.set(config.typeName, config);
  }

  public addInputType(config: PothosTypeReference): void {
    if (this.inputTypes.has(config.typeName)) {
      throw new Error(
        `Input type ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.inputTypes.set(config.typeName, config);
  }

  public addObjectType(config: PothosTypeReference): void {
    if (this.objectTypes.has(config.typeName)) {
      throw new Error(
        `Object type ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.objectTypes.set(config.typeName, config);
  }

  public cloneWithObjectType(
    config: PothosTypeReference,
  ): PothosTypeReferenceContainer {
    return new PothosTypeReferenceContainer(
      this.customScalars,
      this.pothosEnums,
      this.inputTypes,
      safeMergeMap(this.objectTypes, [[config.typeName, config]]),
    );
  }

  public getScalar(name: ScalarFieldType): PothosScalarConfig {
    const scalar = this.customScalars.get(name);
    if (!scalar) {
      return INBUILT_POTHOS_SCALARS[name];
    }
    return scalar;
  }

  public getEnum(name: string): PothosTypeReference {
    const pothosEnum = this.pothosEnums.get(name);
    if (!pothosEnum) {
      throw new Error(`Could not find Pothos enum ${name}`);
    }
    return pothosEnum;
  }

  public getInputType(name: string): PothosTypeReference | undefined {
    return this.inputTypes.get(name);
  }

  public getObjectType(name: string): PothosTypeReference | undefined {
    return this.objectTypes.get(name);
  }

  public getCustomScalars(): PothosCustomScalarConfig[] {
    return [...this.customScalars.values()];
  }

  public merge(
    other: PothosTypeReferenceContainer,
  ): PothosTypeReferenceContainer {
    return new PothosTypeReferenceContainer(
      safeMergeMap(this.customScalars, other.customScalars),
      safeMergeMap(this.pothosEnums, other.pothosEnums),
      safeMergeMap(this.inputTypes, other.inputTypes),
      safeMergeMap(this.objectTypes, other.objectTypes),
    );
  }
}

export interface PothosWriterOptions {
  schemaBuilder: string;
  fieldBuilder: string;
  typeReferences: PothosTypeReferenceContainer;
}
