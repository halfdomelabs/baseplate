import type {
  DefinitionIssueChecker,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  createEntityIssue,
  libraryEntityType,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { sortBy } from 'es-toolkit';

import { TRANSACTIONAL_LIB_TYPE } from '#src/email/transactional-lib/schema/transactional-lib-definition.js';

export function getTransactionalLibName(definition: ProjectDefinition): string {
  const existingNames = new Set(definition.libraries.map((lib) => lib.name));
  let name = 'transactional';
  let counter = 2;
  while (existingNames.has(name)) {
    name = `transactional-${counter}`;
    counter++;
  }
  return name;
}

export function createEmailSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    const pluginConfig = PluginUtils.configByKey(
      container.definition,
      pluginKey,
    );
    if (!pluginConfig) return [];

    const hasTransactionalLib = container.definition.libraries.some(
      (lib) => lib.type === TRANSACTIONAL_LIB_TYPE,
    );
    if (hasTransactionalLib) return [];

    const libName = getTransactionalLibName(container.definition);

    return [
      createEntityIssue(container, pluginEntityType.idFromKey(pluginKey), [], {
        message:
          'Email plugin is enabled but no transactional email library has been added. Add one to define email templates for your project.',
        severity: 'warning',
        fix: {
          label: 'Add transactional email library',
          applySetter: (draft) => {
            draft.libraries = sortBy(
              [
                ...draft.libraries,
                {
                  id: libraryEntityType.generateNewId(),
                  name: libName,
                  type: TRANSACTIONAL_LIB_TYPE,
                },
              ],
              [(lib) => lib.name],
            );
          },
        },
      }),
    ];
  };
}
