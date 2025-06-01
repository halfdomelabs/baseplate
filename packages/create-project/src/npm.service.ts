import axios from 'axios';
import ora from 'ora';

interface NpmPackageInfo {
  name: string;
  'dist-tags': {
    latest: string;
  };
}

export async function getLatestCliVersion(): Promise<string> {
  const spinner = ora({
    text: 'Checking for the latest version of Baseplate CLI...',
  }).start();
  try {
    const url = `https://registry.npmjs.org/@baseplate-dev/project-builder-cli`;
    
    const response = await axios.get<NpmPackageInfo>(url);
    if (!response.data.name) {
      throw new Error('Invalid response from NPM registry');
    }
    spinner.succeed();
    return response.data['dist-tags'].latest;
  } catch {
    spinner.fail('Failed to fetch the latest CLI version');
    throw new Error('Could not determine the latest version of Baseplate CLI');
  }
}