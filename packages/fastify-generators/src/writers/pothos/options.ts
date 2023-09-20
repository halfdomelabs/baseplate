import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import * as R from 'ramda';
import { ScalarFieldType } from '@src/types/fieldTypes.js';
import {
  INBUILT_POTHOS_SCALARS,
  PothosCustomScalarConfig,
  PothosScalarConfig,
} from './scalars.js';

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

export function safeMerge<T>(
  itemOne: Record<string, T>,
  itemTwo: Record<string, T>,
): Record<string, T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return R.mergeWithKey((key) => {
    throw new Error(`Cannot merge key ${key} because it already exists.`);
  })(itemOne, itemTwo);
}

export class PothosTypeReferenceContainer {
  public constructor(
    protected customScalars: Partial<
      Record<ScalarFieldType, PothosCustomScalarConfig>
    > = {},
    protected pothosEnums: Record<string, PothosTypeReference> = {},
    protected inputTypes: Record<string, PothosTypeReference> = {},
    protected objectTypes: Record<string, PothosTypeReference> = {},
  ) {}

  public addCustomScalar(config: PothosCustomScalarConfig): void {
    if (this.customScalars[config.scalar]) {
      throw new Error(
        `Custom scalar ${config.scalar} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.customScalars[config.scalar] = config;
  }

  public addPothosEnum(config: PothosTypeReference): void {
    if (this.pothosEnums[config.typeName]) {
      throw new Error(
        `Enum ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.pothosEnums[config.typeName] = config;
  }

  public addInputType(config: PothosTypeReference): void {
    if (this.inputTypes[config.typeName]) {
      throw new Error(
        `Input type ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.inputTypes[config.typeName] = config;
  }

  public addObjectType(config: PothosTypeReference): void {
    if (this.objectTypes[config.typeName]) {
      throw new Error(
        `Object type ${config.typeName} already has been added to PothosTypeReferenceContainer`,
      );
    }
    this.objectTypes[config.typeName] = config;
  }

  public cloneWithObjectType(
    config: PothosTypeReference,
  ): PothosTypeReferenceContainer {
    return new PothosTypeReferenceContainer(
      this.customScalars,
      this.pothosEnums,
      this.inputTypes,
      safeMerge(this.objectTypes, { [config.typeName]: config }),
    );
  }

  public getScalar(name: ScalarFieldType): PothosScalarConfig {
    const scalar = this.customScalars[name];
    if (!scalar) {
      return INBUILT_POTHOS_SCALARS[name];
    }
    return scalar;
  }

  public getEnum(name: string): PothosTypeReference {
    const pothosEnum = this.pothosEnums[name];
    if (!pothosEnum) {
      throw new Error(`Could not find Pothos enum ${name}`);
    }
    return pothosEnum;
  }

  public getInputType(name: string): PothosTypeReference | null {
    const inputType = this.inputTypes[name];
    return inputType;
  }

  public getObjectType(name: string): PothosTypeReference | null {
    const objectType = this.objectTypes[name];
    return objectType;
  }

  public getCustomScalars(): PothosCustomScalarConfig[] {
    return Object.values(this.customScalars);
  }

  public merge(
    other: PothosTypeReferenceContainer,
  ): PothosTypeReferenceContainer {
    return new PothosTypeReferenceContainer(
      safeMerge(this.customScalars, other.customScalars),
      safeMerge(this.pothosEnums, other.pothosEnums),
      safeMerge(this.inputTypes, other.inputTypes),
      safeMerge(this.objectTypes, other.objectTypes),
    );
  }
}

export interface PothosWriterOptions {
  schemaBuilder: string;
  fieldBuilder: string;
  typeReferences: PothosTypeReferenceContainer;
}
