import { ManagementClient } from 'auth0';

import { config } from '@src/services/config.js';

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
