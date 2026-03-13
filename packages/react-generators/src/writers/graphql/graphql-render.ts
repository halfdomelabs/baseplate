/**
 * GraphQL rendering functions for generating TypeScript code with graphql() calls.
 *
 * This module provides functions to render GraphQL fragments and operations
 * as TsCodeFragment objects that include the graphql() template literal call
 * with proper imports.
 */

import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';

import type { GraphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/graphql-imports.js';

import type { GraphQLFragment, GraphQLOperation } from './graphql.js';

import { renderFragment, renderOperation } from './graphql.js';

// ============================================================================
// Render Options
// ============================================================================

interface RenderOptions {
  /** Whether to export the fragment/operation (default: true) */
  exported?: boolean;
  /** The path of the file being rendered (to determine if fragments need imports) */
  currentPath: string;
  /** The graphql imports provider to resolve the graphql() function import */
  graphqlImports: GraphqlImportsProvider;
}

// ============================================================================
// Fragment Rendering
// ============================================================================

/**
 * Renders a GraphQL fragment as a TsCodeFragment.
 *
 * This function:
 * 1. Renders the GraphQL fragment string
 * 2. Builds the graphql() template literal call
 *
 * @param fragment - The GraphQL fragment definition to render
 * @param options - Render options including export flag and current file path
 * @returns A TsCodeFragment with the rendered fragment and imports
 *
 * @example
 * ```typescript
 * const fragment = renderGraphQLFragment(userRowFragment, {
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
 * // `);
 * ```
 */
export function renderGraphQLFragment(
  fragment: GraphQLFragment,
  options: RenderOptions,
): TsCodeFragment {
  const { exported = true, graphqlImports } = options;

  // Build the GraphQL string
  const graphqlString = renderFragment(fragment);

  // Build imports
  const imports: TsImportDeclaration[] = [graphqlImports.graphql.declaration()];

  // Build the graphql() call
  const exportKeyword = exported ? 'export ' : '';

  const code = `${exportKeyword}const ${fragment.variableName} = graphql(\`
${graphqlString}
\`);`;

  return TsCodeUtils.templateWithImports(imports)`${code}`;
}

// ============================================================================
// Operation Rendering
// ============================================================================

/**
 * Renders a GraphQL operation (query/mutation/subscription) as a TsCodeFragment.
 *
 * This function:
 * 1. Renders the GraphQL operation string
 * 2. Builds the graphql() template literal call
 *
 * @param operation - The GraphQL operation definition to render
 * @param options - Render options including export flag and current file path
 * @returns A TsCodeFragment with the rendered operation and imports
 *
 * @example
 * ```typescript
 * const query = renderGraphQLOperation(usersQuery, {
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
 * // `);
 * ```
 */
export function renderGraphQLOperation(
  operation: GraphQLOperation,
  options: RenderOptions,
): TsCodeFragment {
  const { exported, graphqlImports } = options;

  // Build the GraphQL string
  const graphqlString = renderOperation(operation);

  // Build imports
  const imports: TsImportDeclaration[] = [graphqlImports.graphql.declaration()];

  // Build the graphql() call
  const exportKeyword = exported ? 'export ' : '';

  const code = `${exportKeyword}const ${operation.variableName} = graphql(\`
${graphqlString}
\`);`;

  return TsCodeUtils.templateWithImports(imports)`${code}`;
}
