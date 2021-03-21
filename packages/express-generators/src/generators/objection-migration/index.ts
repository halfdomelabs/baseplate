import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  readTemplate,
} from '@baseplate/sync';
import * as yup from 'yup';
import * as path from 'path';
import { snakeCase } from 'change-case';
import {
  createTypescriptTemplateConfig,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import { expressProvider } from '../express';
import { FIELD_TYPES } from '../../constants/field-types';

interface FieldConfig {
  name: string;
  type: string;
  required: boolean;
  id: boolean;
}

interface BaseMigrationConfig {
  type: string;
}

interface CreateTableMigrationConfig extends BaseMigrationConfig {
  type: 'create-table';
  name: string;
  fields: FieldConfig[];
}

type MigrationConfig = CreateTableMigrationConfig;

interface ObjectionMigrationDescriptor extends GeneratorDescriptor {
  timestamp: string;
  name: string;
  changes: MigrationConfig[];
}

const descriptorSchema = {
  timestamp: yup.number().required(),
  name: yup.string().required(),
  // TODO: Add proper validation
  changes: yup.array(yup.mixed()),
};

const migrationFileConfig = createTypescriptTemplateConfig({
  UP_MIGRATION: { type: 'code-block' },
  DOWN_MIGRATION: { type: 'code-block' },
});

type MigrationFile = TypescriptSourceFile<typeof migrationFileConfig>;

function createSchemaTableWrapper(
  operation: string,
  tableName: string
): TypescriptCodeWrapper {
  return {
    wrap: (contents) =>
      `await knex.schema.${operation}('${tableName}', (table) => {${contents}})`,
  };
}

function getMigrationFromField(field: FieldConfig): TypescriptCodeBlock {
  if (FIELD_TYPES.find((t) => t.name === field.type) === undefined) {
    throw new Error(`Unknown field type ${field.type}`);
  }
  const primary = field.id ? '.primary()' : '';
  const notNullable = field.required ? '.notNullable()' : '';
  return {
    code: `table.${field.type}('${field.name}')${notNullable}${primary}`,
  };
}

function generateCreateTableMigration(
  file: MigrationFile,
  migration: CreateTableMigrationConfig
): void {
  file.addCodeBlock(
    'UP_MIGRATION',
    TypescriptCodeUtils.wrapBlock(
      TypescriptCodeUtils.mergeBlocks(
        migration.fields.map((field) => getMigrationFromField(field))
      ),
      createSchemaTableWrapper('createTable', migration.name)
    )
  );
  file.addCodeBlock('DOWN_MIGRATION', {
    code: `await knex.schema.dropTable('${migration.name}')`,
  });
}

const ObjectionMigrationGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ObjectionMigrationDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    express: expressProvider,
  },
  createGenerator(descriptor, { express }) {
    const migrationFile = new TypescriptSourceFile({
      UP_MIGRATION: { type: 'code-block' },
      DOWN_MIGRATION: { type: 'code-block' },
    });
    const migrationFileName = `${descriptor.timestamp}_${snakeCase(
      descriptor.name
    )}.ts`;
    const migrationPath = path.join(
      express.getRootFolder(),
      'migrations',
      migrationFileName
    );
    return {
      build: async (context) => {
        descriptor.changes.forEach((migration) => {
          switch (migration.type) {
            case 'create-table':
              generateCreateTableMigration(migrationFile, migration);
              break;
            default:
              throw new Error(
                `Unknown migration type ${migration.type as string}`
              );
          }
        });

        const migrationTemplate = await readTemplate(__dirname, 'migration.ts');

        context.addAction(
          migrationFile.renderToAction(migrationTemplate, migrationPath)
        );
      },
    };
  },
});

export default ObjectionMigrationGenerator;
