import type { TsImportDeclaration } from './types.js';

/**
 * A builder for creating import declarations.
 */
interface TsImportDeclarationBuilder {
  /**
   * Add a default import.
   * @param defaultImport - The default import to add.
   * @returns The builder.
   */
  default: (defaultImport: string) => TsImportDeclarationBuilder;
  /**
   * Add a namespace import.
   * @param namespaceImport - The namespace import to add.
   * @returns The builder.
   */
  namespace: (namespaceImport: string) => TsImportDeclarationBuilder;
  /**
   * Add a named import.
   * @param namedImport - The named import to add.
   * @param alias - The alias to add to the named import.
   * @returns The builder.
   */
  named: (namedImport: string, alias?: string) => TsImportDeclarationBuilder;
  /**
   * Add a type-only import.
   * @returns The builder.
   */
  typeOnly: () => TsImportDeclarationBuilder;
  /**
   * Add a from import.
   * @param from - The from import to add.
   * @returns The builder.
   */
  from: (from: string) => TsImportDeclaration;
}

/**
 * Create a builder for creating import declarations.
 * @param declarationPartial - The partial declaration to use for the builder.
 * @returns The builder.
 */
function tsImportDeclarationBuilder(
  declarationPartial: Omit<TsImportDeclaration, 'source'>,
): TsImportDeclarationBuilder {
  const newBuilder = (
    partial: Partial<TsImportDeclaration>,
  ): TsImportDeclarationBuilder =>
    tsImportDeclarationBuilder({
      ...declarationPartial,
      ...partial,
    });
  return {
    default: (defaultImport: string) => newBuilder({ defaultImport }),
    namespace: (namespaceImport: string) => newBuilder({ namespaceImport }),
    named: (namedImport: string) =>
      newBuilder({
        namedImports: [
          ...(declarationPartial.namedImports ?? []),
          { name: namedImport },
        ],
      }),
    typeOnly: () => newBuilder({ isTypeOnly: true }),
    from: (from: string) => ({ ...declarationPartial, source: from }),
  };
}

export function tsImportBuilder(): TsImportDeclarationBuilder {
  return tsImportDeclarationBuilder({});
}
