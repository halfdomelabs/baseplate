// @ts-nocheck

import { config } from '%configServiceImports';
import { ManagementClient } from 'auth';

let cachedClient: ManagementClient | null = null;

export function getAuthManagementClient(): ManagementClient {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new ManagementClient({
    domain: config.AUTH_TENANT_DOMAIN,
    clientId: config.AUTH_CLIENT_ID,
    clientSecret: config.AUTH_CLIENT_SECRET,
  });

  cachedClient = client;

  return client;
}
