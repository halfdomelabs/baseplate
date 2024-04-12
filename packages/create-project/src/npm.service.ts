/* eslint-disable no-console */
import { input } from '@inquirer/prompts';
import axios, { AxiosError } from 'axios';
import ora from 'ora';

interface NpmPackageInfo {
  name: string;
  'dist-tags': {
    latest: string;
  };
}

class InvalidTokenError extends Error {
  constructor() {
    super('API token appears invalid');
  }
}

async function fetchNpmPackageVersion(
  token: string,
): Promise<string | undefined> {
  const spinner = ora({
    text: 'Checking for the latest version of Baseplate CLI...',
  }).start();
  try {
    const url = `https://registry.npmjs.org/@halfdomelabs/project-builder-cli`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.get<NpmPackageInfo>(url, { headers });
    if (!response.data?.name) {
      throw new Error('Invalid response from NPM registry');
    }
    spinner.succeed();
    return response.data['dist-tags']?.latest;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) {
      spinner.fail(
        'Your NPM token appears invalid. Please try again with a valid token.\n',
      );
      throw new InvalidTokenError();
    }
  } finally {
    if (spinner.isSpinning) {
      spinner.fail();
    }
  }
}

export async function getNpmTokenAndVersion(): Promise<{
  npmToken: string;
  cliVersion: string;
}> {
  const NPM_TOKEN_REGEX = /^npm_[\w-]{10,100}$/;

  let latestVersion: string | undefined;
  let npmToken: string;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    npmToken = await input({
      message: 'NPM Token',
      validate: (input: string) => {
        if (!NPM_TOKEN_REGEX.test(input)) {
          return 'Please enter a valid NPM token';
        }

        return true;
      },
    });

    try {
      console.log('');
      latestVersion = await fetchNpmPackageVersion(npmToken);
      break;
    } catch (error) {
      if (!(error instanceof InvalidTokenError)) {
        throw error;
      }
    }
  }

  if (!latestVersion) {
    throw new Error('Could not determine the latest version of Baseplate CLI');
  }

  return { npmToken, cliVersion: latestVersion };
}
