import { TypescriptSourceFile } from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { expressFeatureProvider } from '../feature';
import { objectionOrmProvider } from '../objection-orm';

interface ObjectionFeatureDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type ObjectionFeatureProvider = {
  getModelFolder(): string;
  addModelFile(file: string): void;
};

export const objectionFeatureProvider = createProviderType<ObjectionFeatureProvider>(
  'objectionFeature'
);

const ObjectionFeatureGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ObjectionFeatureDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    expressFeature: expressFeatureProvider,
    objectionOrm: objectionOrmProvider,
  },
  exports: {
    objectionFeature: objectionFeatureProvider,
  },
  createGenerator(descriptor, { expressFeature, objectionOrm }) {
    const modelFiles: string[] = [];

    return {
      getProviders: () => ({
        objectionFeature: {
          getModelFolder() {
            return `${expressFeature.getFeatureFolder()}/models`;
          },
          addModelFile(file) {
            modelFiles.push(file);
          },
        },
      }),
      build: (context) => {
        if (modelFiles.length) {
          const modelsFile = new TypescriptSourceFile({});
          const modelsFileContents = modelFiles
            .map((file) => `export * from '@/${file}'`)
            .join('\n');
          context.addAction(
            modelsFile.renderToAction(
              modelsFileContents,
              `${expressFeature.getFeatureFolder()}/models/index.ts`
            )
          );

          objectionOrm.addModelFile(
            `${expressFeature.getFeatureFolder()}/models`
          );
        }
      },
    };
  },
});

export default ObjectionFeatureGenerator;
