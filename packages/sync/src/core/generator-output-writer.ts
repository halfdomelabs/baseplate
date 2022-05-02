import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs-extra';
import R from 'ramda';
import { logToConsole } from '@src/utils/logger';
import { mergeStrings } from '@src/utils/merge';
import { FileData, GeneratorOutput } from './generator-output';

const exec = promisify(childProcess.exec);

async function mergeContents(
  newContents: string,
  filePath: string,
  cleanContents?: string
): Promise<{ contents: string; hasConflict: boolean } | null> {
  const pathExists = await fs.pathExists(filePath);
  if (!pathExists) {
    return { contents: newContents, hasConflict: false };
  }
  const existingContents = await fs.readFile(filePath, 'utf8');

  if (
    existingContents.includes('<<<<<<<') &&
    existingContents.includes('>>>>>>>')
  ) {
    throw new Error(`Conflict detected in ${filePath}. Stopping write.`);
  }

  // we will skip writing the file if the contents are unchanged from before or the
  // new contents matches the existing contents

  // TODO: HACK: Can create an option for this in the future
  // Necessary because package.json files are not formatted using a provided formatter
  if (filePath.endsWith('/package.json')) {
    if (
      R.equals(JSON.parse(existingContents), JSON.parse(newContents)) ||
      (cleanContents &&
        R.equals(JSON.parse(cleanContents), JSON.parse(newContents)))
    ) {
      return null;
    }
  } else if (
    existingContents === newContents ||
    cleanContents === newContents
  ) {
    return null;
  }

  return mergeStrings(existingContents, newContents, cleanContents);
}

interface ModifiedWriteFileResult {
  type: 'modified';
  path: string;
  contents: string | Buffer;
  hasConflict?: boolean;
  originalPath: string;
}

interface SkippedWriteFileResult {
  type: 'skipped';
}

type WriteFileResult = ModifiedWriteFileResult | SkippedWriteFileResult;

async function writeFile(
  filePath: string,
  data: FileData,
  originalPath: string
): Promise<WriteFileResult> {
  // if file exists and we never overwrite, return false
  const { options, contents, formatter } = data;
  if (options?.neverOverwrite) {
    const fileExists = await fs.pathExists(filePath);
    if (fileExists) {
      return { type: 'skipped' };
    }
  }

  if (contents instanceof Buffer) {
    if (formatter) {
      throw new Error(`Cannot format Buffer contents for ${filePath}`);
    }

    // we don't attempt 3-way merge on Buffer contents

    const pathExists = await fs.pathExists(filePath);
    if (pathExists) {
      const existingContents = await fs.readFile(filePath);
      if (contents.equals(existingContents)) {
        return { type: 'skipped' };
      }
    }
    return { type: 'modified', path: filePath, contents, originalPath };
  }

  let formattedContents = contents;
  if (formatter) {
    try {
      formattedContents = await formatter.format(contents, filePath);
    } catch (err) {
      console.error(`Error formatting ${filePath}\n`, err);
    }
  }
  // check if we need to do a 3-way merge
  const cleanContents = options?.cleanContents;

  // attempt 3-way merge
  const mergeResult = await mergeContents(
    formattedContents,
    filePath,
    cleanContents
  );
  // if there's no merge result, existing contents matches new contents so no modification is required
  if (!mergeResult) {
    return { type: 'skipped' };
  }
  const { contents: mergedContents, hasConflict } = mergeResult;

  return {
    type: 'modified',
    path: filePath,
    contents: mergedContents,
    hasConflict,
    originalPath,
  };
}

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

function getNodePrefix(): string {
  if (process.env.NODE_ENV === 'test') {
    return '';
  }
  if (process.env.VOLTA_HOME) {
    return 'volta run ';
  }
  return '';
}

export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string
): Promise<void> {
  // write files
  const filenames = Object.keys(output.files);

  const isModifiedFileResult = (
    result: WriteFileResult
  ): result is ModifiedWriteFileResult => result.type === 'modified';

  const fileResults = await Promise.all(
    filenames.map((filename) =>
      writeFile(
        path.join(outputDirectory, filename),
        output.files[filename],
        filename
      )
    )
  );

  const modifiedFiles = fileResults.filter(isModifiedFileResult);
  const modifiedFilenames = modifiedFiles.map((result) => result.originalPath);
  const conflictFilenames: string[] = modifiedFiles
    .filter((result) => result.hasConflict)
    .map((result) => result.originalPath);
  // TODO: parallelize?
  for (const modifiedFile of modifiedFiles) {
    await fs.ensureDir(path.dirname(modifiedFile.path));
    if (modifiedFile.contents instanceof Buffer) {
      await fs.writeFile(modifiedFile.path, modifiedFile.contents);
    } else {
      await fs.writeFile(modifiedFile.path, modifiedFile.contents, {
        encoding: 'utf-8',
      });
    }
  }

  if (conflictFilenames.length) {
    logToConsole(
      chalk.red(
        `Conflicts occurred while writing files:\n${conflictFilenames.join(
          '\n'
        )}`
      )
    );
    if (output.postWriteCommands.length) {
      logToConsole(`\nOnce resolved, please run the following commands:`);
    }
  }

  // run post write commands

  // Volta and Yarn prepend their own PATHs to Node which can
  // bugger up node resolution. This forces it to run normally again
  const nodePrefix = getNodePrefix();
  const NODE_COMMANDS = ['node', 'yarn', 'npm'];

  for (const command of output.postWriteCommands) {
    const { onlyIfChanged = [], workingDirectory = '' } = command.options || {};
    const changedList = Array.isArray(onlyIfChanged)
      ? onlyIfChanged
      : [onlyIfChanged];

    if (
      command.options?.onlyIfChanged == null ||
      changedList.some((file) => modifiedFilenames.includes(file))
    ) {
      const commandString = NODE_COMMANDS.includes(
        command.command.split(' ')[0]
      )
        ? `${nodePrefix}${command.command}`
        : command.command;

      if (conflictFilenames.length) {
        logToConsole(command.command);
      } else {
        logToConsole(`Running ${commandString}...`);
        await exec(commandString, {
          cwd: path.join(outputDirectory, workingDirectory),
        });
      }
    }
  }
}
