import { createActionCreator } from '@baseplate/sync';
import { promises as fs } from 'fs';
import path from 'path';
import R from 'ramda';

interface Options {
  defaults: Record<string, string>;
  envFilePath: string;
}

async function loadFile(file: string): Promise<string> {
  try {
    await fs.access(file);
  } catch (err) {
    return '';
  }
  return fs.readFile(file, 'utf-8');
}

function parseEnvFile(contents: string): Record<string, string> {
  return R.fromPairs(
    contents
      .split('\n')
      .filter((line) => !line.startsWith('#') && line.includes('='))
      .map((line): [string, string] => [
        line.substring(0, line.indexOf('=')),
        line.substring(line.indexOf('=')),
      ])
  );
}

export const writeEnvFile = createActionCreator<Options>(
  'write-env-file',
  async (options, context) => {
    const { currentDirectory } = context;
    const { defaults, envFilePath } = options;

    const filePath = path.join(currentDirectory, envFilePath);
    const existingEnvFile = await loadFile(filePath);
    const existingEnvContents = parseEnvFile(existingEnvFile);
    // map new to existing
    const newEntries = Object.keys(defaults).filter(
      (d) => !(d in existingEnvContents)
    );
    if (!newEntries.length) {
      return;
    }
    const newEntriesText = newEntries
      .map((key) => `${key}=${defaults[key]}`)
      .join('\n');
    await fs.writeFile(
      filePath,
      `${existingEnvFile}${existingEnvFile.length ? '\n' : ''}${newEntriesText}`
    );
  }
);
