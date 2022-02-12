import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs-extra';
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
  for (const command of output.postWriteCommands) {
    const { onlyIfChanged = [], workingDirectory = '' } = command.options || {};
    const changedList = Array.isArray(onlyIfChanged)
      ? onlyIfChanged
      : [onlyIfChanged];

    if (
      !changedList.length ||
      changedList.some((file) => modifiedFiles.includes(file))
    ) {
      await exec(command.command, {
        cwd: path.join(outputDirectory, workingDirectory),
      });
    }
  }
}
