import R, { T } from 'ramda';
import {
  CallExpression,
  FunctionDeclaration,
  Identifier,
  Project,
  SyntaxKind,
} from 'ts-morph';
import { notEmpty } from '../../utils/array';
import {
  mergeTypescriptCodeBlocks,
  mergeTypescriptCodeWrappers,
  TypescriptCodeBlock,
  TypescriptCodeWrapper,
  TypescriptCodeWrapperRenderer,
} from './codeEntries';
import {
  getImportDeclarationEntries,
  writeImportDeclarations,
} from './imports';

type TypescriptCodeIdentifierConfig = {};

interface TypescriptCodeBlockConfig extends TypescriptCodeIdentifierConfig {
  type: 'code-block';
  default?: string;
  single?: boolean;
}

interface TypescriptCodeWrapperConfig extends TypescriptCodeIdentifierConfig {
  type: 'code-wrapper';
}

type TypescriptCodeConfig =
  | TypescriptCodeBlockConfig
  | TypescriptCodeWrapperConfig;

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

  constructor(config: T) {
    this.config = config;
    const keys = Object.keys(config);
    this.codeBlocks = R.fromPairs(
      keys
        .filter((k) => config[k].type === 'code-block')
        .map((k) => [k, [] as TypescriptCodeBlock[]])
    );
    this.codeWrappers = R.fromPairs(
      keys
        .filter((k) => config[k].type === 'code-wrapper')
        .map((k) => [k, [] as TypescriptCodeWrapper[]])
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
        default:
          throw new Error(`Unknown config type ${this.config[key].type}`);
      }
    });
  }

  render(
    template: string,
    fileDirectory: string,
    identifierReplacements?: Record<string, string>
  ): string {
    const project = new Project();

    // stripe any ts-nocheck from header
    const strippedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');
    const file = project.createSourceFile('temp.ts', strippedTemplate);

    const fileImports = getImportDeclarationEntries(file);

    // collate all entry import declarations and write it out
    const entries = R.flatten([
      Object.values(this.codeBlocks),
      Object.values(this.codeWrappers),
    ]);
    const allImports = [
      ...fileImports,
      ...R.flatten(entries.map((e) => e.imports).filter(notEmpty)),
    ];

    file.getImportDeclarations().forEach((i) => i.remove());

    file.insertText(0, (writer) => {
      writeImportDeclarations(writer, allImports, fileDirectory);
      writer.writeLine('');
    });

    // fill in code blocks
    const blockReplacements: {
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
                : mergeTypescriptCodeBlocks(this.codeBlocks[identifier]);
            blockReplacements.push({
              identifier: node as Identifier,
              contents: mergedBlock,
            });
          }
        }
      }
    });

    blockReplacements.forEach(({ identifier, contents }) => {
      if (identifier.getParentIfKind(SyntaxKind.ExpressionStatement)) {
        // if simple block, replace whole line
        identifier.getParent().replaceWithText(contents);
      } else {
        identifier.replaceWithText(contents);
      }
    });

    const wrapperReplacements: {
      callExpression: CallExpression;
      render: TypescriptCodeWrapperRenderer;
    }[] = [];

    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpression = node as CallExpression;
        const name = callExpression.getExpression().getText();
        console.log(name);
        if (name && this.config[name]) {
          const configEntry = this.config[name];
          if (configEntry.type === 'code-wrapper') {
            wrapperReplacements.push({
              callExpression,
              render: mergeTypescriptCodeWrappers(this.codeWrappers[name]),
            });
          }
        }
      }
    });
    wrapperReplacements.forEach(({ callExpression, render }) => {
      callExpression.replaceWithText(
        render(callExpression.getArguments()[0].getFullText() || '')
      );
    });

    return file.getFullText();
  }
}
