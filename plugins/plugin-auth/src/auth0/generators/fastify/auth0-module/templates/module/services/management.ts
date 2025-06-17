// @ts-nocheck

import { config } from '%configServiceImports';
import { ManagementClient } from 'auth0';

let cachedClient: ManagementClient | null = null;

export function getAuth0ManagementClient(): ManagementClient {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new ManagementClient({
    domain: config.AUTH0_TENANT_DOMAIN,
    clientId: config.AUTH0_CLIENT_ID,
    clientSecret: config.AUTH0_CLIENT_SECRET,
  });

  cachedClient = client;

  return client;
}
