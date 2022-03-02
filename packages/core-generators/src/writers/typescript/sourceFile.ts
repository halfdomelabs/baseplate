/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */

import path from 'path';
import { BuilderAction, writeFormattedAction } from '@baseplate/sync';
import R from 'ramda';
import {
  CallExpression,
  ExportDeclaration,
  Identifier,
  Project,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import { notEmpty } from '../../utils/array';
import {
  TypescriptCodeUtils,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeWrapper,
  TypescriptCodeWrapperFunction,
  TypescriptCodeEntryOptions,
  mergeCodeEntryOptions,
} from './codeEntries';
import {
  getImportDeclarationEntries,
  resolveModule,
  writeImportDeclarations,
  PathMapEntry,
} from './imports';

interface TypescriptCodeBlockConfig {
  type: 'code-block';
  default?: string;
  single?: boolean;
}

interface TypescriptCodeExpressionConfig {
  type: 'code-expression';
  default?: string;
  multiple?: {
    separator: string;
  };
}

interface TypescriptCodeWrapperConfig {
  type: 'code-wrapper';
}

type TypescriptCodeConfig =
  | TypescriptCodeBlockConfig
  | TypescriptCodeWrapperConfig
  | TypescriptCodeExpressionConfig;

export type TypescriptTemplateConfig<T = Record<string, unknown>> = {
  [K in keyof T]: TypescriptCodeConfig;
};

type InferCodeEntry<T extends TypescriptCodeConfig> =
  T extends TypescriptCodeBlockConfig
    ? TypescriptCodeBlock
    : T extends TypescriptCodeWrapperConfig
    ? TypescriptCodeWrapper
    : never;

type InferCodeEntries<T extends TypescriptTemplateConfig> = {
  [K in keyof T]: InferCodeEntry<T[K]>;
};

export function createTypescriptTemplateConfig<
  T extends TypescriptTemplateConfig<Record<string, unknown>>
>(config: T): T {
  return config;
}

export abstract class TypescriptSourceContent<
  T extends TypescriptTemplateConfig<Record<string, unknown>>
> {
  protected config: T;

  protected hasCodeGenerated = false;

  protected codeBlocks: Record<string, TypescriptCodeBlock[]>;

  protected codeWrappers: Record<string, TypescriptCodeWrapper[]>;

  protected codeExpressions: Record<string, TypescriptCodeExpression[]>;

  constructor(config: T) {
    this.config = config;
    const keys = Object.keys(config);
    this.codeBlocks = R.fromPairs(
      keys.filter((k) => config[k].type === 'code-block').map((k) => [k, []])
    );
    this.codeWrappers = R.fromPairs(
      keys.filter((k) => config[k].type === 'code-wrapper').map((k) => [k, []])
    );
    this.codeExpressions = R.fromPairs(
      keys
        .filter((k) => config[k].type === 'code-expression')
        .map((k) => [k, []])
    );
  }

  protected checkNotGenerated(): void {
    if (this.hasCodeGenerated) {
      throw new Error('Cannot modify code entries once generated');
    }
  }

  addCodeBlock<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeBlockConfig
      ? TypescriptCodeBlock | string
      : never
  ): void {
    this.checkNotGenerated();
    this.codeBlocks[name].push(
      typeof entry === 'string' ? new TypescriptCodeBlock(entry) : entry
    );
  }

  addCodeWrapper<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeWrapperConfig
      ? TypescriptCodeWrapper
      : never
  ): void {
    this.checkNotGenerated();
    this.codeWrappers[name].push(entry);
  }

  addCodeExpression<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeExpressionConfig
      ? TypescriptCodeExpression | string
      : never
  ): void {
    this.checkNotGenerated();
    this.codeExpressions[name].push(
      typeof entry === 'string' ? new TypescriptCodeExpression(entry) : entry
    );
  }

  addCodeEntries(entries: Partial<InferCodeEntries<T>>): void {
    this.checkNotGenerated();
    Object.keys(entries).forEach((key) => {
      switch (this.config[key].type) {
        case 'code-block':
          // TODO: Fix typings
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.addCodeBlock(key, entries[key] as unknown as any);
          break;
        case 'code-wrapper':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.addCodeWrapper(key, entries[key] as unknown as any);
          break;
        case 'code-expression':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.addCodeExpression(key, entries[key] as unknown as any);
          break;
        default:
          throw new Error(`Unknown config type ${this.config[key].type}`);
      }
    });
  }

  getCodeBlocks<K extends keyof T & string>(name: K): TypescriptCodeBlock[] {
    return this.codeBlocks[name] || [];
  }

  protected renderIntoSourceFile(
    file: SourceFile,
    identifierReplacements?: Record<string, string>
  ): SourceFile {
    const blockReplacements: {
      identifier: Identifier;
      contents: string;
    }[] = [];
    const expressionReplacements: {
      identifier: Identifier;
      contents: string;
    }[] = [];
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.Identifier) {
        const identifier = node.getText();
        if (identifierReplacements && identifierReplacements[identifier]) {
          node.replaceWithText(identifierReplacements[identifier]);
        } else if (this.config[identifier]) {
          const configEntry = this.config[identifier];
          if (configEntry.type === 'code-block') {
            const blocks = this.codeBlocks[identifier];
            if (configEntry.single && blocks.length > 1) {
              throw new Error(`Only expected a single entry for ${identifier}`);
            }
            const mergedBlock =
              configEntry.default && !blocks.length
                ? configEntry.default
                : TypescriptCodeUtils.mergeBlocks(
                    this.codeBlocks[identifier],
                    '\n\n'
                  ).content;
            blockReplacements.push({
              identifier: node as Identifier,
              contents: mergedBlock,
            });
          } else if (configEntry.type === 'code-expression') {
            const providedExpressions = this.codeExpressions[identifier];
            if (!configEntry.multiple && providedExpressions.length > 1) {
              throw new Error(`Only expected a single entry for ${identifier}`);
            }
            const expression =
              !providedExpressions.length && configEntry.default
                ? configEntry.default
                : TypescriptCodeUtils.mergeExpressions(
                    providedExpressions,
                    configEntry.multiple?.separator || ''
                  ).content;
            expressionReplacements.push({
              identifier: node as Identifier,
              contents: expression || '',
            });
          }
        }
      }
    });

    blockReplacements.forEach(({ identifier, contents }) => {
      const ALLOWED_PARENTS = [
        SyntaxKind.ExpressionStatement,
        SyntaxKind.PropertySignature,
        SyntaxKind.PropertyDeclaration,
      ];
      const parent = identifier.getParent();
      if (!ALLOWED_PARENTS.includes(parent.getKind())) {
        throw new Error(
          'The parent was not of a syntax kind of Expression/Property'
        );
      }
      parent.replaceWithText(contents);
    });

    expressionReplacements.forEach(({ identifier, contents }) => {
      // Check if expression is in self-enclosing element <IDENTIFIER /> and
      // replace whole element if so
      if (
        identifier.getParent().getKind() === SyntaxKind.JsxSelfClosingElement
      ) {
        identifier.getParent().replaceWithText(contents);
      } else {
        identifier.replaceWithText(contents);
      }
    });

    const wrapperReplacements: {
      callExpression: CallExpression;
      wrap: TypescriptCodeWrapperFunction;
    }[] = [];

    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpression = node as CallExpression;
        const name = callExpression.getExpression().getText();
        if (name && this.config[name]) {
          const configEntry = this.config[name];
          if (configEntry.type === 'code-wrapper') {
            wrapperReplacements.push({
              callExpression,
              wrap: TypescriptCodeUtils.mergeWrappers(this.codeWrappers[name])
                .wrap,
            });
          }
        }
      }
    });
    wrapperReplacements.forEach(({ callExpression, wrap }) => {
      callExpression.replaceWithText(
        wrap(callExpression.getArguments()[0].getFullText() || '')
      );
    });

    this.hasCodeGenerated = true;

    return file;
  }
}

export class TypescriptSourceBlock<
  T extends TypescriptTemplateConfig<any>
> extends TypescriptSourceContent<T> {
  protected blockOptions: TypescriptCodeEntryOptions;

  constructor(config: T, options: TypescriptCodeEntryOptions = {}) {
    super(config);
    this.blockOptions = options;
  }

  renderToBlock(
    template: string,
    identifierReplacements?: Record<string, string>
  ): TypescriptCodeBlock {
    const project = new Project();

    // strip any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');
    const file = project.createSourceFile('/', strippedTemplate);

    this.renderIntoSourceFile(file, identifierReplacements);

    return new TypescriptCodeBlock(
      file.getFullText(),
      null,
      mergeCodeEntryOptions(
        [
          Object.values(this.codeBlocks),
          Object.values(this.codeWrappers),
          Object.values(this.codeExpressions),
          this.blockOptions,
        ].flat(2)
      )
    );
  }
}

interface TypescriptSourceFileOptions {
  pathMappings?: PathMapEntry[];
}

export class TypescriptSourceFile<
  T extends TypescriptTemplateConfig<any>
> extends TypescriptSourceContent<T> {
  protected sourceFileOptions: TypescriptSourceFileOptions;

  constructor(config: T, options: TypescriptSourceFileOptions = {}) {
    super(config);
    this.sourceFileOptions = options;
  }

  renderToText(
    template: string,
    destination: string,
    identifierReplacements?: Record<string, string>
  ): string {
    this.hasCodeGenerated = true;

    const project = new Project();

    // strip any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');
    const file = project.createSourceFile(
      path.basename(destination),
      strippedTemplate
    );

    // insert manual imports
    const providedEntries = R.flatten([
      Object.values(this.codeBlocks),
      Object.values(this.codeWrappers),
      Object.values(this.codeExpressions),
    ]);

    const headerBlocks = providedEntries.flatMap(
      (e) => e?.options?.headerBlocks || []
    );

    const entries = [...providedEntries, ...headerBlocks];

    const importStrings = R.flatten(
      entries.map((e) => e?.options?.importText).filter(notEmpty)
    ).join('\n');

    file.insertText(0, importStrings);

    const fileImports = getImportDeclarationEntries(file);

    // collate all entry import declarations and write it out
    const allImports = [
      ...fileImports,
      ...R.flatten(entries.map((e) => e?.options?.imports).filter(notEmpty)),
    ];

    file.getImportDeclarations().forEach((i) => i.remove());

    if (headerBlocks.length) {
      file.insertText(0, (writer) => {
        writer.writeLine(
          TypescriptCodeUtils.mergeBlocks(headerBlocks, '\n\n').content
        );
        writer.writeLine('');
      });
    }

    file.insertText(0, (writer) => {
      writeImportDeclarations(writer, allImports, path.dirname(destination), {
        pathMapEntries: this.sourceFileOptions.pathMappings,
      });
      writer.writeLine('');
    });

    // fill in code blocks
    this.renderIntoSourceFile(file, identifierReplacements);

    // process all export from declarations
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.ExportDeclaration) {
        const exportDeclaration = node as ExportDeclaration;
        const moduleSpecifier = exportDeclaration.getModuleSpecifier();
        if (moduleSpecifier) {
          exportDeclaration.setModuleSpecifier(
            resolveModule(
              moduleSpecifier.getLiteralValue(),
              path.dirname(destination),
              { pathMapEntries: this.sourceFileOptions.pathMappings }
            )
          );
        }
      }
    });

    const text = file.getFullText();

    // get rid of any leading whitespace and add newline to the end
    return `${text.trim()}\n`;
  }

  renderToActionFromText(
    template: string,
    destination: string,
    identifierReplacements?: Record<string, string>
  ): BuilderAction {
    return {
      execute: async (builder) => {
        const contents = this.renderToText(
          template,
          destination,
          identifierReplacements
        );
        await builder.apply(
          writeFormattedAction({
            destination,
            contents,
          })
        );
      },
    };
  }

  renderToAction(
    templateFile: string,
    destination: string,
    identifierReplacements?: Record<string, string>
  ): BuilderAction {
    return {
      execute: async (builder) => {
        const template = await builder.readTemplate(templateFile);
        const contents = this.renderToText(
          template,
          destination,
          identifierReplacements
        );
        await builder.apply(
          writeFormattedAction({
            destination,
            contents,
          })
        );
      },
    };
  }
}
