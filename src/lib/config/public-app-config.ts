export interface PublicAppConfig {
  apiUrl: string;
  apiBase: string;
}

let cachedConfig: PublicAppConfig | null = null;

export function getPublicAppConfig(): PublicAppConfig {
  if (cachedConfig) return cachedConfig;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || apiUrl;

  cachedConfig = {
    apiUrl,
    apiBase,
  };
  return cachedConfig;
}
