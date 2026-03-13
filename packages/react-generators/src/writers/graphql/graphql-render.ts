/**
 * GraphQL rendering functions for generating TypeScript code with graphql() calls.
 *
 * This module provides functions to render GraphQL fragments and operations
 * as TsCodeFragment objects that include the graphql() template literal call
 * with proper imports.
 */

import type { TsCodeFragment } from '@baseplate-dev/core-generators';

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
  /** The graphql imports provider to resolve the graphql() function import */
  graphqlImports: GraphqlImportsProvider;
}

// ============================================================================
// Shared Rendering
// ============================================================================

function renderGraphQLCodeFragment(
  variableName: string,
  graphqlString: string,
  options: RenderOptions,
): TsCodeFragment {
  const { exported = true, graphqlImports } = options;
  const imports = [graphqlImports.graphql.declaration()];
  const exportKeyword = exported ? 'export ' : '';

  const code = `${exportKeyword}const ${variableName} = graphql(\`
${graphqlString}
\`);`;

  return TsCodeUtils.templateWithImports(imports)`${code}`;
}

// ============================================================================
// Fragment Rendering
// ============================================================================

/**
 * Renders a GraphQL fragment as a TsCodeFragment.
 *
 * @param fragment - The GraphQL fragment definition to render
 * @param options - Render options including export flag
 * @returns A TsCodeFragment with the rendered fragment and imports
 */
export function renderGraphQLFragment(
  fragment: GraphQLFragment,
  options: RenderOptions,
): TsCodeFragment {
  return renderGraphQLCodeFragment(
    fragment.variableName,
    renderFragment(fragment),
    options,
  );
}

// ============================================================================
// Operation Rendering
// ============================================================================

/**
 * Renders a GraphQL operation (query/mutation/subscription) as a TsCodeFragment.
 *
 * @param operation - The GraphQL operation definition to render
 * @param options - Render options including export flag
 * @returns A TsCodeFragment with the rendered operation and imports
 */
export function renderGraphQLOperation(
  operation: GraphQLOperation,
  options: RenderOptions,
): TsCodeFragment {
  return renderGraphQLCodeFragment(
    operation.variableName,
    renderOperation(operation),
    options,
  );
}
