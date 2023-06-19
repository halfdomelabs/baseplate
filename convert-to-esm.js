const fs = require('fs');
const path = require('path');

const PATHS = {
  '@src': './src',
};

async function getFilesInDirectory(dir) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  const files = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'templates') {
      return getFilesInDirectory(fullPath);
    } else if (entry.isFile() && path.extname(entry.name) === '.ts') {
      return fullPath;
    }
  });

  const resolvedFiles = await Promise.all(files);

  return resolvedFiles.flat().filter((file) => file !== undefined);
}

async function processFilesInDirectory(dir, rootDir) {
  const files = await getFilesInDirectory(dir);
  // Wait for all the async operations to complete
  for (const file of files) {
    await processFile(file, rootDir);
  }
}

async function processFile(file, rootDir) {
  console.log(`Processing ${file}...`);
  const data = await fs.promises.readFile(file, 'utf8');

  const regex =
    /^[ei][xm]port\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:'([^']+)'|"([^"]+)"))[\s]*?(?:;|$|)/gm;
  const resolvedData = data.replace(
    regex,
    (match, singleQuotePath, doubleQuotePath) => {
      const modulePath = singleQuotePath || doubleQuotePath;

      // skip if already processed
      if (modulePath.endsWith('.js')) {
        return match;
      }

      const resolvedPath = Object.entries(PATHS).reduce((acc, [key, value]) => {
        return acc.replace(key, value);
      }, modulePath);

      if (!resolvedPath.startsWith('.')) {
        return match;
      }

      const fullPath = path.join(
        // if no paths replacement occurred, the path is relative to the file, otherwise to rootDir
        resolvedPath === modulePath ? path.dirname(file) : rootDir,
        resolvedPath
      );

      const isDir = fs.existsSync(fullPath)
        ? fs.statSync(fullPath).isDirectory()
        : fs.statSync(`${fullPath}.ts`).isDirectory();
      if (isDir) {
        return match.replace(modulePath, `${modulePath}/index.js`);
      } else {
        return match.replace(modulePath, `${modulePath}.js`);
      }
    }
  );

  await fs.promises.writeFile(file, resolvedData, 'utf8');
}

// Start processing from the current directory
processFilesInDirectory('./src', '.').catch(console.error); // Handle any errors that occurred
