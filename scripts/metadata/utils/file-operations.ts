import chalk from 'chalk';
import { diffLines } from 'diff';
import * as fs from 'node:fs';

export function readJsonFile(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function readTextFile(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

export function writeTextFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function showDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
): void {
  console.info(chalk.bold(`\n${filePath}:`));

  const diff = diffLines(oldContent, newContent);

  for (const part of diff) {
    const color = part.added
      ? chalk.green
      : part.removed
        ? chalk.red
        : chalk.gray;
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    const lines = part.value.split('\n').filter((line) => line !== '');

    for (const line of lines) {
      console.info(color(`${prefix} ${line}`));
    }
  }
}

export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}
