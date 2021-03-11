import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
} from '@baseplate/sync';
import * as yup from 'yup';
import { paramCase, pascalCase } from 'change-case';
import {
  createTypescriptTemplateConfig,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import R from 'ramda';
import path from 'path';
import { expressProvider } from '../express';

interface ExpressFeatureDescriptor extends GeneratorDescriptor {
  name: string;
}

const descriptorSchema = {
  name: yup.string(),
};

const FEATURE_FILE_CONFIG = createTypescriptTemplateConfig({
  FEATURE_CONFIG: { type: 'code-expression' },
});

export interface ExpressFeatureProvider {
  addFeatureEntry: (name: string, expression: TypescriptCodeExpression) => void;
  getFeatureFolder(): string;
}

export const expressFeatureProvider = createProviderType<ExpressFeatureProvider>(
  'express-feature'
);

const ExpressFeatureGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ExpressFeatureDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    app: expressProvider,
  },
  exports: {
    expressFeature: expressFeatureProvider,
  },
  childGenerators: {
    providers: { multiple: true },
  },
  createGenerator(descriptor, { app }) {
    const { name } = descriptor;
    const featureFolderName = paramCase(name);
    const featureVariable = `${pascalCase(name)}Feature`;

    app.getFeatureFile().addCodeExpression('APP_FEATURES', {
      expression: featureVariable,
      importText: [`import ${featureVariable} from './${featureFolderName}'`],
    });

    const featureEntries: Record<string, TypescriptCodeExpression[]> = {};
    const featureFile = new TypescriptSourceFile(FEATURE_FILE_CONFIG);

    return {
      getProviders: () => ({
        expressFeature: {
          addFeatureEntry(entryName, expression) {
            if (!featureEntries[entryName]) {
              featureEntries[entryName] = [];
            }
            featureEntries[entryName].push(expression);
          },
          getFeatureFolder() {
            return path.join(app.getFeaturesFolder(), featureFolderName);
          },
        },
      }),
      build: async (context) => {
        const mergedEntries = R.mapObjIndexed(
          (entries) => TypescriptCodeUtils.mergeExpressionsAsArray(entries),
          featureEntries
        );
        featureFile.addCodeExpression(
          'FEATURE_CONFIG',
          TypescriptCodeUtils.mergeExpressionsAsObject(mergedEntries)
        );
        const featureFileTemplate = await readTemplate(__dirname, 'index.ts');
        context.addAction(
          featureFile.renderToAction(
            featureFileTemplate,
            `${app.getFeaturesFolder()}/${featureFolderName}/index.ts`,
            { FEATURE_NAME: featureVariable }
          )
        );
      },
    };
  },
});

export default ExpressFeatureGenerator;
