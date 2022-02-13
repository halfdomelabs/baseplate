import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs-extra';
import R from 'ramda';
import { FileData, GeneratorOutput } from './generator-output';

const exec = promisify(childProcess.exec);

async function contentEquals(
  contents: string | Buffer,
  filePath: string
): Promise<boolean> {
  const pathExists = await fs.pathExists(filePath);
  if (!pathExists) {
    return false;
  }
  if (contents instanceof Buffer) {
    const fileContents = await fs.readFile(filePath);
    return contents.equals(fileContents);
  }
  const fileString = await fs.readFile(filePath, 'utf8');
  // HACK: Can create an option for this in the future
  // Necessary because package.json files are not formatted using a provided formatter
  if (filePath.endsWith('/package.json')) {
    return R.equals(JSON.parse(contents), JSON.parse(fileString));
  }
  return contents === fileString;
}

async function writeFile(filePath: string, data: FileData): Promise<boolean> {
  let formattedContents = data.contents;
  if (data.formatter) {
    if (data.contents instanceof Buffer) {
      throw new Error(`Cannot format Buffer contents for ${filePath}`);
    }
    formattedContents = await data.formatter.format(data.contents, filePath);
  }
  // if file exists and we never overwrite, return false
  if (data.options?.neverOverwrite) {
    const fileExists = await fs.pathExists(filePath);
    if (fileExists) {
      return false;
    }
  }
  // check if file matches contents already
  const isContentSame = await contentEquals(formattedContents, filePath);

  if (isContentSame) {
    return false;
  }
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, formattedContents, {
    encoding: 'utf-8',
  });
  return true;
}

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

function getNodePrefix(): string {
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
  const modifiedFiles: string[] = [];
  const filenames = Object.keys(output.files);

  // TODO: parallelize
  for (const filename of filenames) {
    const wasModified = await writeFile(
      path.join(outputDirectory, filename),
      output.files[filename]
    );
    if (wasModified) {
      modifiedFiles.push(filename);
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
      !changedList.length ||
      changedList.some((file) => modifiedFiles.includes(file))
    ) {
      const commandString = NODE_COMMANDS.includes(
        command.command.split(' ')[0]
      )
        ? `${nodePrefix}${command.command}`
        : command.command;
      console.log(`Running ${commandString}...`);
      await exec(commandString, {
        cwd: path.join(outputDirectory, workingDirectory),
      });
    }
  }
}
