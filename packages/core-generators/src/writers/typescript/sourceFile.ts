/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */

import { BuilderAction, writeFormattedAction } from '@halfdomelabs/sync';
import { Eta } from 'eta';
import path from 'path';
import * as R from 'ramda';
import {
  CallExpression,
  ExportDeclaration,
  Identifier,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';

import {
  TypescriptCodeUtils,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeWrapper,
  TypescriptCodeWrapperFunction,
  TypescriptCodeEntryOptions,
  mergeCodeEntryOptions,
  TypescriptStringReplacement,
  TypescriptCodeEntry,
  TypescriptCodeContents,
  normalizeTypescriptCodeBlock,
  normalizeTypescriptCodeWrappers,
  normalizeTypescriptCodeExpression,
  normalizeTypescriptStringReplacement,
} from './codeEntries.js';
import {
  getImportDeclarationEntries,
  resolveModule,
  writeImportDeclarations,
  PathMapEntry,
} from './imports.js';
import { ImportMapper } from '../../providers/index.js';
import { notEmpty } from '../../utils/array.js';

interface TypescriptCodeBlockConfig {
  type: 'code-block';
  default?: string | TypescriptCodeBlock;
  single?: boolean;
}

interface TypescriptCodeExpressionConfig {
  type: 'code-expression';
  default?: string | TypescriptCodeExpression;
  multiple?: {
    separator: string;
  };
}

interface TypescriptCodeWrapperConfig {
  type: 'code-wrapper';
  default?: TypescriptCodeWrapperFunction | TypescriptCodeWrapper;
}

interface TypescriptStringReplacementConfig {
  type: 'string-replacement';
  // whether to replace string as comment i.e. prefixed with // IDENTIFIER
  asSingleLineComment?: boolean;
  default?: string | TypescriptStringReplacement;
  multiple?: {
    separator: string;
  };
  // transformer function for replacement if present
  transform?: (replacement: string) => string;
}

type TypescriptCodeConfig =
  | TypescriptCodeBlockConfig
  | TypescriptCodeWrapperConfig
  | TypescriptCodeExpressionConfig
  | TypescriptStringReplacementConfig;

export type TypescriptTemplateConfigOrEntry<T = Record<string, unknown>> = {
  [K in keyof T]: TypescriptCodeConfig | TypescriptCodeEntry;
};

type TypescriptTemplateConfigFromEntry<
  T extends TypescriptCodeConfig | TypescriptCodeEntry,
> = T extends TypescriptCodeConfig
  ? T
  : T extends TypescriptCodeBlock
    ? TypescriptCodeBlockConfig
    : T extends TypescriptCodeWrapper
      ? TypescriptCodeWrapperConfig
      : T extends TypescriptCodeExpression
        ? TypescriptCodeExpressionConfig
        : T extends TypescriptStringReplacement
          ? TypescriptStringReplacementConfig
          : never;

type TypescriptTemplateConfig<
  T extends TypescriptTemplateConfigOrEntry = Record<
    string,
    TypescriptCodeConfig | TypescriptCodeEntry
  >,
> = {
  [K in keyof T]: TypescriptTemplateConfigFromEntry<T[K]>;
};

type InferCodeEntry<T extends TypescriptCodeConfig | TypescriptCodeEntry> =
  T extends TypescriptCodeExpressionConfig
    ? TypescriptCodeExpression | string
    : T extends TypescriptCodeBlockConfig
      ? TypescriptCodeBlock | string
      : T extends TypescriptCodeWrapperConfig
        ? TypescriptCodeWrapper
        : T extends TypescriptStringReplacementConfig
          ? TypescriptStringReplacement | string
          : T extends TypescriptCodeContents
            ? T | string
            : T extends TypescriptCodeEntry
              ? T
              : never;

type InferCodeEntries<T extends TypescriptTemplateConfigOrEntry> = {
  [K in keyof T]: InferCodeEntry<T[K]> | InferCodeEntry<T[K]>[];
};

export function createTypescriptTemplateConfig<
  T extends TypescriptTemplateConfigOrEntry<
    Record<string, TypescriptCodeEntry | TypescriptCodeConfig>
  >,
>(config: T): T {
  return config;
}

interface CodeEntriesContainer {
  codeBlocks: Record<string, TypescriptCodeBlock[]>;
  codeWrappers: Record<string, TypescriptCodeWrapper[]>;
  codeExpressions: Record<string, TypescriptCodeExpression[]>;
  stringReplacements: Record<string, TypescriptStringReplacement[]>;
}

export abstract class TypescriptSourceContent<
  T extends TypescriptTemplateConfigOrEntry<
    Record<string, TypescriptCodeEntry | TypescriptCodeConfig>
  >,
> {
  protected config: Record<string, TypescriptCodeConfig>;

  protected hasCodeGenerated = false;

  protected codeAdditions: TypescriptCodeEntryOptions[] = [];

  protected codeBlocks: Record<string, TypescriptCodeBlock[]>;

  protected codeWrappers: Record<string, TypescriptCodeWrapper[]>;

  protected codeExpressions: Record<string, TypescriptCodeExpression[]>;

  protected stringReplacements: Record<string, TypescriptStringReplacement[]>;

  constructor(configOrEntries: T) {
    const config = R.mapObjIndexed((value): TypescriptCodeConfig => {
      if (value instanceof TypescriptCodeEntry || typeof value === 'string') {
        if (value instanceof TypescriptCodeBlock) {
          return { type: 'code-block', default: value };
        }
        if (value instanceof TypescriptCodeExpression) {
          return { type: 'code-expression', default: value };
        }
        if (value instanceof TypescriptCodeWrapper) {
          return { type: 'code-wrapper', default: value };
        }
        if (
          value instanceof TypescriptStringReplacement ||
          typeof value === 'string'
        ) {
          return { type: 'string-replacement', default: value };
        }
        throw new Error(`Unsupported code entry type: ${value.type}`);
      }
      return value;
    }, configOrEntries);

    this.config = config as TypescriptTemplateConfig<T>;
    const keys = Object.keys(config);
    this.codeBlocks = R.fromPairs(
      keys.filter((k) => config[k].type === 'code-block').map((k) => [k, []]),
    );
    this.codeWrappers = R.fromPairs(
      keys.filter((k) => config[k].type === 'code-wrapper').map((k) => [k, []]),
    );
    this.codeExpressions = R.fromPairs(
      keys
        .filter((k) => config[k].type === 'code-expression')
        .map((k) => [k, []]),
    );
    this.stringReplacements = R.fromPairs(
      keys
        .filter((k) => config[k].type === 'string-replacement')
        .map((k) => [k, []]),
    );
  }

  protected checkNotGenerated(): void {
    if (this.hasCodeGenerated) {
      throw new Error('Cannot modify code entries once generated');
    }
  }

  addCodeAddition(entry: TypescriptCodeEntryOptions): this {
    this.checkNotGenerated();
    this.codeAdditions.push(entry);
    return this;
  }

  addCodeBlock<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeBlockConfig
      ? TypescriptCodeBlock | string
      : never,
  ): this {
    this.checkNotGenerated();
    this.codeBlocks[name].push(
      typeof entry === 'string' ? new TypescriptCodeBlock(entry) : entry,
    );
    return this;
  }

  addCodeWrapper<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeWrapperConfig
      ? TypescriptCodeWrapper
      : never,
  ): this {
    this.checkNotGenerated();
    this.codeWrappers[name].push(entry);
    return this;
  }

  addCodeExpression<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptCodeExpressionConfig
      ? TypescriptCodeExpression | string
      : never,
  ): this {
    this.checkNotGenerated();
    this.codeExpressions[name].push(
      typeof entry === 'string' ? new TypescriptCodeExpression(entry) : entry,
    );
    return this;
  }

  addStringReplacement<K extends keyof T & string>(
    name: K,
    entry: T[K] extends TypescriptStringReplacementConfig
      ? TypescriptStringReplacement | string
      : never,
  ): this {
    this.checkNotGenerated();
    this.stringReplacements[name].push(
      typeof entry === 'string'
        ? new TypescriptStringReplacement(entry)
        : entry,
    );
    return this;
  }

  addCodeEntries(entries: Partial<InferCodeEntries<T>>): this {
    this.checkNotGenerated();
    Object.keys(entries).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const entryArray: any[] = (Array.isArray(entries[key])
        ? entries[key]
        : [entries[key]]) as unknown as any[];
      entryArray.forEach((entry) => {
        switch (this.config[key].type) {
          case 'code-block':
            // TODO: Fix typings
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeBlock(key, entry);
            break;
          case 'code-wrapper':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeWrapper(key, entry);
            break;
          case 'code-expression':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeExpression(key, entry);
            break;
          case 'string-replacement':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addStringReplacement(key, entry);
            break;
          default:
            throw new Error(
              `Unknown config type ${(this.config[key] as { type: string }).type}`,
            );
        }
      });
    });
    return this;
  }

  getCodeBlocks<K extends keyof T & string>(name: K): TypescriptCodeBlock[] {
    return this.codeBlocks[name] ?? [];
  }

  protected processFileReplacements(
    template: string,
    stringReplacements: CodeEntriesContainer['stringReplacements'],
  ): string {
    // strip any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');

    // run through string replacements
    return Object.entries(this.config).reduce((prevValue, [key, config]) => {
      if (config.type !== 'string-replacement') {
        return prevValue;
      }
      const values = stringReplacements[key];
      if (values && !config.multiple && values.length > 1) {
        throw new Error(`Multiple string replacements for ${key} not allowed`);
      }
      const replacementValue = values
        ? TypescriptCodeUtils.mergeStringReplacements(
            values,
            config.multiple?.separator ?? '',
          ).content
        : '';
      const transformedReplacement =
        config.transform && replacementValue
          ? config.transform(replacementValue)
          : replacementValue;
      const searchKey = config.asSingleLineComment ? `// ${key}` : key;
      const newValue = prevValue.replace(
        new RegExp(searchKey, 'g'),
        transformedReplacement || '',
      );
      if (newValue === prevValue) {
        throw new Error(
          `String replacement failed for ${key}: Could not find ${searchKey}`,
        );
      }
      return newValue;
    }, strippedTemplate);
  }

  protected getCodeEntriesWithDefaults(): {
    codeAdditions: TypescriptCodeEntryOptions[];
    codeBlocks: Record<string, TypescriptCodeBlock[]>;
    codeWrappers: Record<string, TypescriptCodeWrapper[]>;
    codeExpressions: Record<string, TypescriptCodeExpression[]>;
    stringReplacements: Record<string, TypescriptStringReplacement[]>;
  } {
    return {
      codeAdditions: this.codeAdditions,
      codeBlocks: R.mapObjIndexed((value, key) => {
        const configEntry = this.config[key];
        if (configEntry.type !== 'code-block') {
          throw new Error('Config entry is not a code block');
        }
        const def = configEntry.default;
        if (value.length) return value;
        return def ? [normalizeTypescriptCodeBlock(def)] : [];
      }, this.codeBlocks),
      codeWrappers: R.mapObjIndexed((value, key) => {
        const configEntry = this.config[key];
        if (configEntry.type !== 'code-wrapper') {
          throw new Error('Config entry is not a code wrapper');
        }
        const def = configEntry.default;
        if (value.length) return value;
        return def ? [normalizeTypescriptCodeWrappers(def)] : [];
      }, this.codeWrappers),
      codeExpressions: R.mapObjIndexed((value, key) => {
        const configEntry = this.config[key];
        if (configEntry.type !== 'code-expression') {
          throw new Error('Config entry is not a code expression');
        }
        const def = configEntry.default;
        if (value.length) return value;
        return def ? [normalizeTypescriptCodeExpression(def)] : [];
      }, this.codeExpressions),
      stringReplacements: R.mapObjIndexed((value, key) => {
        const configEntry = this.config[key];
        if (configEntry.type !== 'string-replacement') {
          throw new Error('Config entry is not a string replacement');
        }
        const def = configEntry.default;
        if (value.length) return value;
        return def ? [normalizeTypescriptStringReplacement(def)] : [];
      }, this.stringReplacements),
    };
  }

  protected renderIntoSourceFile(
    file: SourceFile,
    entries: CodeEntriesContainer,
  ): SourceFile {
    const codeEntries = this.getCodeEntriesWithDefaults();
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
        if (this.config[identifier]) {
          const configEntry = this.config[identifier];
          if (configEntry.type === 'code-block') {
            const blocks = entries.codeBlocks[identifier];
            if (configEntry.single && blocks.length > 1) {
              throw new Error(`Only expected a single entry for ${identifier}`);
            }
            const mergedBlock = !blocks.length
              ? ''
              : TypescriptCodeUtils.mergeBlocks(
                  codeEntries.codeBlocks[identifier],
                  '\n\n',
                ).content;
            blockReplacements.push({
              identifier: node as Identifier,
              contents: mergedBlock,
            });
          } else if (configEntry.type === 'code-expression') {
            const providedExpressions = entries.codeExpressions[identifier];
            if (!configEntry.multiple && providedExpressions.length > 1) {
              throw new Error(`Only expected a single entry for ${identifier}`);
            }
            const expression = !providedExpressions.length
              ? ''
              : TypescriptCodeUtils.mergeExpressions(
                  providedExpressions,
                  configEntry.multiple?.separator ?? '',
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
          'The parent was not of a syntax kind of Expression/Property',
        );
      }
      parent.replaceWithText(contents);
    });

    expressionReplacements.forEach(({ identifier, contents }) => {
      // Check if expression is in self-enclosing element <IDENTIFIER /> and
      // replace whole element if so
      const parent = identifier.getParent();
      if (Node.isJsxSelfClosingElement(parent)) {
        parent.replaceWithText(contents);
      } else if (Node.isParameterDeclaration(parent)) {
        if (contents === '') {
          parent.remove();
        } else {
          parent.replaceWithText(contents);
        }
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
        wrap(callExpression.getArguments()[0].getFullText() || ''),
      );
    });

    this.hasCodeGenerated = true;

    return file;
  }
}

export class TypescriptSourceBlock<
  T extends TypescriptTemplateConfigOrEntry<any>,
> extends TypescriptSourceContent<T> {
  protected blockOptions: TypescriptCodeEntryOptions;

  constructor(config: T, options: TypescriptCodeEntryOptions = {}) {
    super(config);
    this.blockOptions = options;
  }

  renderToBlock(template: string): TypescriptCodeBlock {
    const project = new Project({
      useInMemoryFileSystem: true,
    });

    const entriesWithDefault = this.getCodeEntriesWithDefaults();
    // run through string replacements
    const replacedTemplate = this.processFileReplacements(
      template,
      entriesWithDefault.stringReplacements,
    );
    const file = project.createSourceFile('/', replacedTemplate);

    this.renderIntoSourceFile(file, entriesWithDefault);

    return new TypescriptCodeBlock(
      file.getFullText(),
      null,
      mergeCodeEntryOptions(
        [
          Object.values(entriesWithDefault.codeBlocks),
          Object.values(entriesWithDefault.codeWrappers),
          Object.values(entriesWithDefault.codeExpressions),
          Object.values(entriesWithDefault.stringReplacements),
          this.blockOptions,
          entriesWithDefault.codeAdditions,
        ].flat(2),
      ),
    );
  }
}

export interface TypescriptSourceFileOptions {
  importMappers?: (ImportMapper | undefined)[];
  pathMappings?: PathMapEntry[];
}

interface EtaPreprocessOptions {
  data: Record<string, unknown>;
}

interface FileWriteOptions {
  neverOverwrite?: boolean;
  /**
   * Preprocess template with Eta to allow for more powerful templating options
   * beyond just find-replace.
   *
   * Note: Any comments with // DELIMITER will be replaced with DELIMITER so you can write
   * Eta code in comments.
   */
  preprocessWithEta?: EtaPreprocessOptions;
}

function unnestHeaderBlocks(block: TypescriptCodeBlock): TypescriptCodeBlock[] {
  return [
    ...(block.options.headerBlocks?.flatMap((b) => unnestHeaderBlocks(b)) ??
      []),
    block,
  ];
}

export class TypescriptSourceFile<
  T extends TypescriptTemplateConfigOrEntry<any>,
> extends TypescriptSourceContent<T> {
  protected sourceFileOptions: TypescriptSourceFileOptions;
  protected preImportBlocks: string[] = [];

  constructor(config: T, options: TypescriptSourceFileOptions = {}) {
    super(config);
    this.sourceFileOptions = options;
  }

  addPreImportBlock(block: string): this {
    this.checkNotGenerated();
    this.preImportBlocks.push(block);
    return this;
  }

  renderToText(template: string, destination: string): string {
    this.hasCodeGenerated = true;

    const project = new Project({
      useInMemoryFileSystem: true,
    });

    const entriesWithDefault = this.getCodeEntriesWithDefaults();

    // run through string replacements
    const replacedTemplate = this.processFileReplacements(
      template,
      entriesWithDefault.stringReplacements,
    );

    const file = project.createSourceFile(
      path.basename(destination),
      replacedTemplate,
    );

    // insert manual imports
    const providedEntries = R.flatten([
      Object.values(entriesWithDefault.codeBlocks),
      Object.values(entriesWithDefault.codeWrappers),
      Object.values(entriesWithDefault.codeExpressions),
      Object.values(entriesWithDefault.stringReplacements),
      entriesWithDefault.codeAdditions.map((options) => ({ options })),
    ]);

    const headerBlocks = providedEntries.flatMap(
      (e) =>
        e?.options?.headerBlocks?.flatMap((b) => unnestHeaderBlocks(b)) ?? [],
    );

    const entries = [...providedEntries, ...headerBlocks];

    const importStrings = R.flatten(
      entries.map((e) => e?.options?.importText).filter(notEmpty),
    ).join('\n');

    file.insertText(0, importStrings);

    const fileImports = getImportDeclarationEntries(file);

    // collate all entry import declarations and write it out
    const allImports = [
      ...fileImports,
      ...R.flatten(entries.map((e) => e?.options?.imports).filter(notEmpty)),
    ];

    const importMappers = [
      ...entries.flatMap((e) => e?.options?.importMappers ?? []),
      ...(this.sourceFileOptions.importMappers ?? []),
    ];

    file.getImportDeclarations().forEach((i) => i.remove());

    if (headerBlocks.length) {
      const deduplicatedHeaderBlocks = R.uniqWith(
        (a, b) =>
          a.options.headerKey === b.options.headerKey &&
          a.options.headerKey != null,
        headerBlocks,
      );
      file.insertText(0, (writer) => {
        writer.writeLine(
          TypescriptCodeUtils.mergeBlocks(deduplicatedHeaderBlocks, '\n\n')
            .content,
        );
        writer.writeLine('');
      });
    }

    file.insertText(0, (writer) => {
      writeImportDeclarations(writer, allImports, path.dirname(destination), {
        pathMapEntries: this.sourceFileOptions.pathMappings,
        importMappers: importMappers.filter(notEmpty),
      });
      writer.writeLine('');
    });

    file.insertText(0, (writer) => {
      this.preImportBlocks.forEach((block) => {
        writer.writeLine(block);
      });
    });

    // fill in code blocks
    this.renderIntoSourceFile(file, entriesWithDefault);

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
              { pathMapEntries: this.sourceFileOptions.pathMappings },
            ),
          );
        }
      }
    });

    const text = file.getFullText();

    // get rid of any leading whitespace and add newline to the end
    return `${text.trim()}\n`;
  }

  preprocessWithEta(text: string, options: EtaPreprocessOptions): string {
    const { data } = options;
    const eta = new Eta({
      autoEscape: false,
      rmWhitespace: false,
    });
    const cleanedText = text.replaceAll(/^\s*\/\/\s*<%/gm, `<%`);
    return eta.renderString(cleanedText, data);
  }

  renderToActionFromText(
    template: string,
    destination: string,
    options?: FileWriteOptions,
  ): BuilderAction {
    return {
      execute: async (builder) => {
        const fullPath = builder.resolvePath(destination);
        if (options?.preprocessWithEta) {
          template = this.preprocessWithEta(
            template,
            options.preprocessWithEta,
          );
        }
        const contents = this.renderToText(template, fullPath);
        await builder.apply(
          writeFormattedAction({
            destination,
            contents,
            ...options,
          }),
        );
      },
    };
  }

  renderToAction(
    templateFile: string,
    destination?: string,
    options?: FileWriteOptions,
  ): BuilderAction {
    return {
      execute: async (builder) => {
        const fullPath = builder.resolvePath(destination ?? templateFile);
        let template = await builder.readTemplate(templateFile);
        if (options?.preprocessWithEta) {
          template = this.preprocessWithEta(
            template,
            options.preprocessWithEta,
          );
        }
        const contents = this.renderToText(template, fullPath);
        await builder.apply(
          writeFormattedAction({
            destination: destination ?? templateFile,
            contents,
            ...options,
          }),
        );
      },
    };
  }
}
