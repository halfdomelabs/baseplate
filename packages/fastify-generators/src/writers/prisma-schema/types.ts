type PrismaSchemaBlockType = 'datasource' | 'generator' | 'model' | 'enum';

export interface PrismaSchemaBlock {
  name: string;
  type: PrismaSchemaBlockType;
  contents: string;
}

export type PrismaGeneratorBlock = PrismaSchemaBlock & { type: 'generator' };
export type PrismaDatasourceBlock = PrismaSchemaBlock & { type: 'datasource' };
export type PrismaModelBlock = PrismaSchemaBlock & { type: 'model' };
export type PrismaEnumBlock = PrismaSchemaBlock & { type: 'enum' };
