import {
  nodeGitIgnoreProvider,
  nodeProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  copyDirectoryAction,
  copyFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { expressConfigProvider } from '../config';
import { expressProvider } from '../express';

interface ObjectionOrmDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type ObjectionOrmProvider = {
  addModelFile(file: string): void;
};

export const objectionOrmProvider = createProviderType<ObjectionOrmProvider>(
  'objection-orm'
);

const ObjectionOrmGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ObjectionOrmDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    node: nodeProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
    express: expressProvider,
    config: expressConfigProvider,
  },
  exports: {
    objectionOrm: objectionOrmProvider,
  },
  childGenerators: {
    migrations: {
      multiple: true,
    },
  },
  createGenerator(descriptor, { node, nodeGitIgnore, express, config }) {
    const modelFiles: string[] = [];

    node.addPackages({
      knex: '^0.21.15',
      objection: '^2.2.4',
      ramda: '^0.27.1',
      sqlite3: '^5.0.0',
      pg: '^8.5.1',
    });
    nodeGitIgnore.addExclusions(['/db']);

    express.getServerFile().addCodeBlock('SERVER_MIDDLEWARE', {
      code: 'initializeObjection();',
      importText: [
        "import {initializeObjection} from '@/src/services/db/objection'",
      ],
    });

    config.addConfigEntries({
      DB_CONNECTION_STRING: { expression: 'yup.string().required()' },
    });

    return {
      getProviders: () => ({
        objectionOrm: {
          addModelFile(file) {
            modelFiles.push(file);
          },
        },
      }),
      build: (context) => {
        const modelsFile = new TypescriptSourceFile({});
        const modelsFileContents = modelFiles
          .map((file) => `export * from '@/${file}'`)
          .join('\n');
        context.addAction(
          modelsFile.renderToAction(modelsFileContents, 'src/models.ts')
        );

        context.addAction(
          copyDirectoryAction({
            source: 'services',
            destination: 'src/services',
          })
        );

        context.addAction(
          copyDirectoryAction({
            source: 'migrations',
            destination: 'migrations',
          })
        );

        context.addAction(
          copyFileAction({
            source: 'knexfile.ts',
            destination: 'knexfile.ts',
          })
        );
      },
    };
  },
});

export default ObjectionOrmGenerator;
