import type { TsImportDeclaration } from './types.js';

interface TsImportDeclarationBuilder {
  default: (defaultImport: string) => TsImportDeclarationBuilder;
  namespace: (namespaceImport: string) => TsImportDeclarationBuilder;
  named: (namedImport: string, alias?: string) => TsImportDeclarationBuilder;
  typeOnly: () => TsImportDeclarationBuilder;
  from: (from: string) => TsImportDeclaration;
}

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
