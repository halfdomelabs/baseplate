import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { WebAppConfig } from '#src/schema/apps/web/web-app.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { createEntityIssue } from '#src/parser/definition-issue-utils.js';

/**
 * Checks that web apps only reference libraries of type `react-library`.
 *
 * `libraryRefs` and `componentsLibraryRef` accept any library entity, but
 * only a react-library package can be imported by a web app's generated code.
 */
export function checkLibraryRefType(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { apps, libraries } = container.definition;
  const issues: DefinitionIssue[] = [];

  const webApps = apps.filter((app): app is WebAppConfig => app.type === 'web');

  for (const app of webApps) {
    for (const [refIndex, libraryId] of app.libraryRefs.entries()) {
      const library = libraries.find((lib) => lib.id === libraryId);
      if (!library || library.type === 'react-library') {
        continue;
      }

      issues.push(
        createEntityIssue(container, app.id, ['libraryRefs', refIndex], {
          message: `App '${app.name}' references library '${library.name}' which is not a React library and cannot be imported`,
          severity: 'error',
        }),
      );
    }

    if (app.componentsLibraryRef) {
      const library = libraries.find(
        (lib) => lib.id === app.componentsLibraryRef,
      );
      if (library && library.type !== 'react-library') {
        issues.push(
          createEntityIssue(container, app.id, ['componentsLibraryRef'], {
            message: `App '${app.name}' references library '${library.name}' as its components library, which is not a React library`,
            severity: 'error',
          }),
        );
      }
    }
  }

  return issues;
}
