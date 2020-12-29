export interface ProviderType<Provider = any> {
  name: string;
}

export function createProviderType<T>(name: string): ProviderType<T> {
  return { name };
}
