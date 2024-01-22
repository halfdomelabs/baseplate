import { ProjectDefinitionContainer } from '../project-definition-container.js';
import { TransformerConfig } from '@src/schema/index.js';

function getTransformName(
  definitionContainer: ProjectDefinitionContainer,
  transformer: TransformerConfig,
): string {
  switch (transformer.type) {
    case 'password':
      return 'Password';
    case 'embeddedRelation':
      return definitionContainer.nameFromId(transformer.foreignRelationRef);
    case 'file':
      return definitionContainer.nameFromId(transformer.fileRelationRef);
  }
}

export const ModelTransformerUtils = {
  getTransformName,
};
