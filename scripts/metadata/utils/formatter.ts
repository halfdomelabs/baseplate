import path from 'node:path';
import * as prettier from 'prettier';

export async function formatContent(
  content: string,
  filePath: string,
): Promise<string> {
  try {
    // Get the prettier config from the root
    const configPath = path.join(process.cwd(), 'prettier.config.js');

    const formatted = await prettier.format(content, {
      filepath: filePath,
      ...(await prettier.resolveConfig(configPath)),
    });

    return formatted;
  } catch (error) {
    // If prettier fails, return original content
    console.warn(`Failed to format ${filePath}: ${String(error)}`);
    return content;
  }
}

export async function formatJson(obj: unknown): Promise<string> {
  const jsonString = JSON.stringify(obj, null, 2);
  return formatContent(jsonString, 'package.json');
}
