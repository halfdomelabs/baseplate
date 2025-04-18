/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  CallExpression,
  ExportDeclaration,
  Identifier,
  SourceFile,
} from 'ts-morph';

import {
  type BuilderAction,
  normalizePathToProjectPath,
  type WriteFileOptions,
} from '@halfdomelabs/sync';
import { mapValues, uniqWith } from 'es-toolkit';
import { Eta } from 'eta';
import path from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

import type { ImportMapper } from '../../providers/index.js';
import type {
  TypescriptCodeContents,
  TypescriptCodeEntryOptions,
  TypescriptCodeWrapperFunction,
} from './code-entries.js';
import type { ModuleResolutionKind, PathMapEntry } from './imports.js';

import { notEmpty } from '../../utils/array.js';
import {
  mergeCodeEntryOptions,
  normalizeTypescriptCodeBlock,
  normalizeTypescriptCodeExpression,
  normalizeTypescriptCodeWrappers,
  normalizeTypescriptStringReplacement,
  TypescriptCodeBlock,
  TypescriptCodeEntry,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
  TypescriptStringReplacement,
} from './code-entries.js';
import {
  getImportDeclarationEntries,
  resolveModule,
  writeImportDeclarations,
} from './imports.js';

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
  protected config: Map<string, TypescriptCodeConfig>;

  protected hasCodeGenerated = false;

  protected codeAdditions: TypescriptCodeEntryOptions[] = [];

  protected codeBlocks: Record<string, TypescriptCodeBlock[]>;

  protected codeWrappers: Record<string, TypescriptCodeWrapper[]>;

  protected codeExpressions: Record<string, TypescriptCodeExpression[]>;

  protected stringReplacements: Record<string, TypescriptStringReplacement[]>;

  constructor(configOrEntries: T) {
    const config = mapValues(configOrEntries, (value): TypescriptCodeConfig => {
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
    });

    this.config = new Map(Object.entries(config));
    const keys = Object.keys(config);
    this.codeBlocks = Object.fromEntries(
      keys.filter((k) => config[k].type === 'code-block').map((k) => [k, []]),
    );
    this.codeWrappers = Object.fromEntries(
      keys.filter((k) => config[k].type === 'code-wrapper').map((k) => [k, []]),
    );
    this.codeExpressions = Object.fromEntries(
      keys
        .filter((k) => config[k].type === 'code-expression')
        .map((k) => [k, []]),
    );
    this.stringReplacements = Object.fromEntries(
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
    for (const key of Object.keys(entries)) {
      const entryArray: any[] = (Array.isArray(entries[key])
        ? entries[key]
        : [entries[key]]) as unknown as any[];
      for (const entry of entryArray) {
        const config = this.config.get(key);
        if (!config) {
          throw new Error(`Unknown config key ${key}`);
        }
        switch (config.type) {
          case 'code-block': {
            // TODO: Fix typings
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeBlock(key, entry);
            break;
          }
          case 'code-wrapper': {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeWrapper(key, entry);
            break;
          }
          case 'code-expression': {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addCodeExpression(key, entry);
            break;
          }
          case 'string-replacement': {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.addStringReplacement(key, entry);
            break;
          }
          default: {
            throw new Error(
              `Unknown config type ${(config as { type: string }).type}`,
            );
          }
        }
      }
    }
    return this;
  }

  getCodeBlocks(name: keyof T & string): TypescriptCodeBlock[] {
    return this.codeBlocks[name] ?? [];
  }

  protected processFileReplacements(
    template: string,
    stringReplacements: Partial<CodeEntriesContainer['stringReplacements']>,
  ): string {
    // strip any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');

    // run through string replacements
    let result = strippedTemplate;
    for (const [key, config] of this.config) {
      if (config.type !== 'string-replacement') {
        continue;
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
      const newValue = result.replaceAll(
        new RegExp(searchKey, 'g'),
        transformedReplacement || '',
      );
      if (newValue === result) {
        throw new Error(
          `String replacement failed for ${key}: Could not find ${searchKey}`,
        );
      }
      result = newValue;
    }
    return result;
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
      codeBlocks: mapValues(this.codeBlocks, (value, key) => {
        const configEntry = this.config.get(key);
        if (configEntry?.type !== 'code-block') {
          throw new Error('Config entry is not a code block');
        }
        const def = configEntry.default;
        if (value.length > 0) return value;
        return def ? [normalizeTypescriptCodeBlock(def)] : [];
      }),
      codeWrappers: mapValues(this.codeWrappers, (value, key) => {
        const configEntry = this.config.get(key);
        if (configEntry?.type !== 'code-wrapper') {
          throw new Error('Config entry is not a code wrapper');
        }
        const def = configEntry.default;
        if (value.length > 0) return value;
        return def ? [normalizeTypescriptCodeWrappers(def)] : [];
      }),
      codeExpressions: mapValues(this.codeExpressions, (value, key) => {
        const configEntry = this.config.get(key);
        if (configEntry?.type !== 'code-expression') {
          throw new Error('Config entry is not a code expression');
        }
        const def = configEntry.default;
        if (value.length > 0) return value;
        return def ? [normalizeTypescriptCodeExpression(def)] : [];
      }),
      stringReplacements: mapValues(this.stringReplacements, (value, key) => {
        const configEntry = this.config.get(key);
        if (configEntry?.type !== 'string-replacement') {
          throw new Error('Config entry is not a string replacement');
        }
        const def = configEntry.default;
        if (value.length > 0) return value;
        return def ? [normalizeTypescriptStringReplacement(def)] : [];
      }),
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
        const configEntry = this.config.get(identifier);
        if (configEntry) {
          if (configEntry.type === 'code-block') {
            const blocks = entries.codeBlocks[identifier];
            if (configEntry.single && blocks.length > 1) {
              throw new Error(`Only expected a single entry for ${identifier}`);
            }
            const mergedBlock =
              blocks.length === 0
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
            const expression =
              providedExpressions.length === 0
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

    for (const { identifier, contents } of blockReplacements) {
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
    }

    for (const { identifier, contents } of expressionReplacements) {
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
    }

    const wrapperReplacements: {
      callExpression: CallExpression;
      wrap: TypescriptCodeWrapperFunction;
    }[] = [];

    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpression = node as CallExpression;
        const name = callExpression.getExpression().getText();
        const configEntry = name && this.config.get(name);
        if (configEntry && configEntry.type === 'code-wrapper') {
          wrapperReplacements.push({
            callExpression,
            wrap: TypescriptCodeUtils.mergeWrappers(this.codeWrappers[name])
              .wrap,
          });
        }
      }
    });
    for (const { callExpression, wrap } of wrapperReplacements) {
      callExpression.replaceWithText(
        wrap(callExpression.getArguments()[0].getFullText() || ''),
      );
    }

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
        ]
          .flat()
          .flat(),
      ),
    );
  }
}

export interface TypescriptSourceFileOptions {
  importMappers?: (ImportMapper | undefined)[];
  pathMappings?: PathMapEntry[];
  moduleResolution: ModuleResolutionKind;
}

interface EtaPreprocessOptions {
  data: Record<string, unknown>;
}

interface SourceFileWriteOptions extends WriteFileOptions {
  /**
   * The id of the file
   */
  id?: string;
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

  constructor(config: T, options: TypescriptSourceFileOptions) {
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
    const providedEntries = [
      Object.values(entriesWithDefault.codeBlocks),
      Object.values(entriesWithDefault.codeWrappers),
      Object.values(entriesWithDefault.codeExpressions),
      Object.values(entriesWithDefault.stringReplacements),
      entriesWithDefault.codeAdditions.map((options) => ({ options })),
    ].flat(/* The depth is always 2 */ 2);

    const headerBlocks = providedEntries.flatMap(
      (e) =>
        e.options.headerBlocks?.flatMap((b) => unnestHeaderBlocks(b)) ?? [],
    );

    const entries = [...providedEntries, ...headerBlocks];

    const importStrings = entries
      .flatMap((e) => e.options.importText)
      .filter(notEmpty)
      .join('\n');

    file.insertText(0, importStrings);

    const fileImports = getImportDeclarationEntries(file);

    // collate all entry import declarations and write it out
    const allImports = [
      ...fileImports,
      ...entries.flatMap((e) => e.options.imports).filter(notEmpty),
    ];

    const importMappers = [
      ...entries.flatMap((e) => e.options.importMappers ?? []),
      ...(this.sourceFileOptions.importMappers ?? []),
    ];

    for (const i of file.getImportDeclarations()) i.remove();

    if (headerBlocks.length > 0) {
      const deduplicatedHeaderBlocks = uniqWith(
        headerBlocks,
        (a, b) =>
          a.options.headerKey === b.options.headerKey &&
          a.options.headerKey != null,
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
      writeImportDeclarations(
        writer,
        allImports,
        path.dirname(normalizePathToProjectPath(destination)),
        {
          pathMapEntries: this.sourceFileOptions.pathMappings,
          importMappers: importMappers.filter(notEmpty),
          moduleResolution: this.sourceFileOptions.moduleResolution,
        },
      );
      writer.writeLine('');
    });

    file.insertText(0, (writer) => {
      for (const block of this.preImportBlocks) {
        writer.writeLine(block);
      }
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
              {
                pathMapEntries: this.sourceFileOptions.pathMappings,
                moduleResolution: this.sourceFileOptions.moduleResolution,
              },
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
    options?: SourceFileWriteOptions,
  ): BuilderAction {
    return {
      execute: (builder) => {
        const { id, preprocessWithEta, ...rest } = options ?? {};
        if (preprocessWithEta) {
          template = this.preprocessWithEta(template, preprocessWithEta);
        }
        const contents = this.renderToText(template, destination);
        builder.writeFile({
          id: id ?? normalizePathToProjectPath(destination),
          destination,
          contents,
          options: {
            shouldNeverOverwrite: options?.shouldNeverOverwrite,
            ...rest,
          },
        });
      },
    };
  }

  renderToAction(
    templateFile: string,
    destination?: string,
    options?: SourceFileWriteOptions,
  ): BuilderAction {
    return {
      execute: async (builder) => {
        const { id, preprocessWithEta, ...rest } = options ?? {};
        const fullPath = destination ?? templateFile;
        let template = await builder.readTemplate(templateFile);
        if (preprocessWithEta) {
          template = this.preprocessWithEta(template, preprocessWithEta);
        }
        const contents = this.renderToText(template, fullPath);
        builder.writeFile({
          id: id ?? fullPath,
          destination: fullPath,
          contents,
          options: {
            shouldNeverOverwrite: options?.shouldNeverOverwrite,
            ...rest,
          },
        });
      },
    };
  }
}
