import { PASCAL_CASE_REGEX } from '@baseplate-dev/utils';
import { camelCase } from 'es-toolkit';
import { pluralize } from 'inflection';

import { titleizeCamel } from '#src/utils/case.js';

interface ModelNameVariants {
  camel: string;
  pascal: string;
  title: string;
  lowercaseWords: string;
  graphqlById: string;
  graphqlList: string;
  graphqlObjectType: string;
  pluralTitle: string;
  pluralPascal: string;
}

export function getModelNameVariants(modelName: string): ModelNameVariants {
  if (!PASCAL_CASE_REGEX.test(modelName)) {
    throw new Error(`Model name must be in PascalCase: ${modelName}`);
  }
  const camelCaseName = camelCase(modelName);
  const titleizedModelName = titleizeCamel(modelName);

  return {
    camel: camelCaseName,
    pascal: modelName,
    title: titleizedModelName,
    lowercaseWords: titleizeCamel(modelName).toLocaleLowerCase(),
    graphqlById: camelCaseName,
    graphqlList: pluralize(camelCaseName),
    graphqlObjectType: modelName,
    pluralTitle: titleizeCamel(pluralize(modelName)),
    pluralPascal: pluralize(modelName),
  };
}
