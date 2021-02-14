import { promises as fs } from 'fs';
import path from 'path';

export function readTemplate(
  rootDir: string,
  templatePath: string
): Promise<string> {
  return fs.readFile(path.join(rootDir, 'templates', templatePath), 'utf-8');
}
