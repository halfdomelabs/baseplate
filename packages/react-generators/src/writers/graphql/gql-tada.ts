/**
 * gql.tada rendering functions for generating TypeScript code with graphql() calls.
 *
 * This module provides functions to render GraphQL fragments and operations
 * as TsCodeFragment objects that include the graphql() template literal call
 * with proper imports and dependency arrays.
 */

import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsImportBuilder } from '@baseplate-dev/core-generators';

import type { GraphQLFragment, GraphQLOperation } from './graphql.js';

import {
  collectFragmentDependencies,
  renderFragment,
  renderOperation,
} from './graphql.js';

// ============================================================================
// Render Options
// ============================================================================

export interface RenderOptions {
  /** Whether to export the fragment/operation (default: true) */
  exported?: boolean;
  /** The path of the file being rendered (to determine if fragments need imports) */
  currentPath: string;
}

// ============================================================================
// Fragment Rendering
// ============================================================================

/**
 * Renders a GraphQL fragment as a TsCodeFragment for gql.tada.
 *
 * This function:
 * 1. Renders the GraphQL fragment string
 * 2. Collects fragment dependencies from spread fields
 * 3. Generates imports for fragments from different files
 * 4. Builds the graphql() call with dependency array
 *
 * @example
 * ```typescript
 * const fragment = renderTadaFragment(userRowFragment, {
 *   currentPath: './user-table.tsx',
 *   exported: true,
 * });
 * // Output:
 * // export const userRowFragment = graphql(`
 * //   fragment UserTable_items on User {
 * //     id
 * //     email
 * //     ...RoleManagerDialog_user
 * //   }
 * // `, [roleManagerDialogUserFragment]);
 * ```
 */
export function renderTadaFragment(
  fragment: GraphQLFragment,
  options: RenderOptions,
): TsCodeFragment {
  const { exported = true, currentPath } = options;

  // Collect all fragment dependencies from fields
  const dependencies = collectFragmentDependencies(fragment.fields);

  // Build the GraphQL string
  const graphqlString = renderFragment(fragment);

  // Build imports for fragments from different files
  const imports: TsImportDeclaration[] = [
    tsImportBuilder(['graphql']).from('@src/graphql'),
  ];
  const depVariableNames: string[] = [];

  for (const dep of dependencies) {
    depVariableNames.push(dep.variableName);

    // Only import if from a different file
    if (dep.path !== currentPath) {
      imports.push(tsImportBuilder([dep.variableName]).from(dep.path));
    }
  }

  // Build the graphql() call
  const exportKeyword = exported ? 'export ' : '';
  const depsArray =
    depVariableNames.length > 0 ? `, [${depVariableNames.join(', ')}]` : '';

  const code = `${exportKeyword}const ${fragment.variableName} = graphql(\`
${graphqlString}
\`${depsArray});`;

  return TsCodeUtils.templateWithImports(imports)`${code}`;
}

// ============================================================================
// Operation Rendering
// ============================================================================

/**
 * Renders a GraphQL operation (query/mutation/subscription) as a TsCodeFragment for gql.tada.
 *
 * This function:
 * 1. Renders the GraphQL operation string
 * 2. Collects fragment dependencies from spread fields
 * 3. Generates imports for fragments from different files
 * 4. Builds the graphql() call with dependency array
 *
 * @example
 * ```typescript
 * const query = renderTadaOperation(usersQuery, {
 *   currentPath: './queries.ts',
 *   exported: true,
 * });
 * // Output:
 * // export const usersQuery = graphql(`
 * //   query Users {
 * //     users {
 * //       ...UserTable_items
 * //     }
 * //   }
 * // `, [userRowFragment]);
 * ```
 */
export function renderTadaOperation(
  operation: GraphQLOperation,
  options: RenderOptions,
): TsCodeFragment {
  const { exported, currentPath } = options;

  // Collect all fragment dependencies from fields
  const dependencies = collectFragmentDependencies(operation.fields);

  // Build the GraphQL string
  const graphqlString = renderOperation(operation);

  // Build imports for fragments from different files
  const imports: TsImportDeclaration[] = [
    tsImportBuilder(['graphql']).from('@src/graphql'),
  ];
  const depVariableNames: string[] = [];

  for (const dep of dependencies) {
    depVariableNames.push(dep.variableName);

    // Only import if from a different file
    if (dep.path !== currentPath) {
      imports.push(tsImportBuilder([dep.variableName]).from(dep.path));
    }
  }

  // Build the graphql() call
  const exportKeyword = exported ? 'export ' : '';
  const depsArray =
    depVariableNames.length > 0 ? `, [${depVariableNames.join(', ')}]` : '';

  const code = `${exportKeyword}const ${operation.variableName} = graphql(\`
${graphqlString}
\`${depsArray});`;

  return TsCodeUtils.templateWithImports(imports)`${code}`;
}
