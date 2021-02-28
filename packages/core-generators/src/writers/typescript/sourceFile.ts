import R from 'ramda';
import { CallExpression, Identifier, Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import { Action, writeFormattedAction } from '@baseplate/sync';
import { notEmpty } from '../../utils/array';
import {
  TypescriptCodeUtils,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeWrapper,
  TypescriptCodeWrapperFunction,
} from './codeEntries';
import {
  getImportDeclarationEntries,
  writeImportDeclarations,
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

type TypescriptTemplateConfig<T = any> = {
  [K in keyof T]: TypescriptCodeConfig;
};

type InferCodeEntry<
  T extends TypescriptCodeConfig
> = T extends TypescriptCodeBlockConfig
  ? TypescriptCodeBlock
  : T extends TypescriptCodeWrapperConfig
  ? TypescriptCodeWrapper
  : never;

type InferCodeEntries<T extends TypescriptTemplateConfig> = {
  [K in keyof T]: InferCodeEntry<T[K]>;
};

export function createTypescriptTemplateConfig<
  T extends TypescriptTemplateConfig<any>
>(config: T): T {
  return config;
}

export class TypescriptSourceFile<T extends TypescriptTemplateConfig<any>> {
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
    entry: T[K] extends TypescriptCodeBlockConfig ? TypescriptCodeBlock : never
  ): void {
    this.checkNotGenerated();
    this.codeBlocks[name].push(entry);
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
      ? TypescriptCodeExpression
      : never
  ): void {
    this.checkNotGenerated();
    this.codeExpressions[name].push(entry);
  }

  addCodeEntries(entries: Partial<InferCodeEntries<T>>): void {
    this.checkNotGenerated();
    Object.keys(entries).forEach((key) => {
      switch (this.config[key].type) {
        case 'code-block':
          this.addCodeBlock(key, (entries[key] as unknown) as any);
          break;
        case 'code-wrapper':
          this.addCodeWrapper(key, (entries[key] as unknown) as any);
          break;
        case 'code-expression':
          this.addCodeExpression(key, (entries[key] as unknown) as any);
          break;
        default:
          throw new Error(`Unknown config type ${this.config[key].type}`);
      }
    });
  }

  render(
    template: string,
    destination: string,
    identifierReplacements?: Record<string, string>
  ): string {
    this.hasCodeGenerated = true;

    const project = new Project();

    // stripe any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');
    const file = project.createSourceFile(
      path.basename(destination),
      strippedTemplate
    );

    // insert manual imports
    const entries = R.flatten([
      Object.values(this.codeBlocks),
      Object.values(this.codeWrappers),
      Object.values(this.codeExpressions),
    ]);
    const importStrings = R.flatten(
      entries.map((e) => e?.importText).filter(notEmpty)
    ).join('\n');

    file.insertText(0, importStrings);

    const fileImports = getImportDeclarationEntries(file);

    // collate all entry import declarations and write it out
    const allImports = [
      ...fileImports,
      ...R.flatten(entries.map((e) => e?.imports).filter(notEmpty)),
    ];

    file.getImportDeclarations().forEach((i) => i.remove());

    file.insertText(0, (writer) => {
      writeImportDeclarations(writer, allImports, path.dirname(destination));
      writer.writeLine('');
    });

    // fill in code blocks
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
                  ).code;
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
                  ).expression;
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
      identifier.replaceWithText(contents);
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

    return file.getFullText();
  }

  renderToAction(
    template: string,
    destination: string,
    identifierReplacements?: Record<string, string>
  ): Action {
    return writeFormattedAction({
      destination,
      contents: this.render(template, destination, identifierReplacements),
    });
  }
}
