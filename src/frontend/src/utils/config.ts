interface JsonConfig {
  backend_host: string;
  backend_canister_id: string;
  project_id: string;
  ii_derivation_origin: string;
}

export interface Config {
  backend_host?: string;
  backend_canister_id: string;
  storage_gateway_url: string;
  bucket_name: string;
  project_id: string;
  ii_derivation_origin?: string;
}

const DEFAULT_STORAGE_GATEWAY_URL = "https://blob.caffeine.ai";
const DEFAULT_BUCKET_NAME = "default-bucket";
const DEFAULT_PROJECT_ID = "0000000-0000-0000-0000-00000000000";

let configCache: Config | null = null;

function getEnv(key: string): string | undefined {
  return (import.meta as unknown as { env: Record<string, string> }).env?.[key];
}

export async function loadConfig(): Promise<Config> {
  if (configCache) return configCache;

  const backendCanisterId = getEnv("CANISTER_ID_BACKEND");
  const envBaseUrl = getEnv("BASE_URL") ?? "/";
  const baseUrl = envBaseUrl.endsWith("/") ? envBaseUrl : `${envBaseUrl}/`;

  try {
    const response = await fetch(`${baseUrl}env.json`);
    const config = (await response.json()) as JsonConfig;

    const fullConfig: Config = {
      backend_host:
        config.backend_host === "undefined" ? undefined : config.backend_host,
      backend_canister_id: (config.backend_canister_id === "undefined"
        ? backendCanisterId
        : config.backend_canister_id) as string,
      storage_gateway_url: getEnv("STORAGE_GATEWAY_URL") ?? "nogateway",
      bucket_name: DEFAULT_BUCKET_NAME,
      project_id:
        config.project_id !== "undefined"
          ? config.project_id
          : DEFAULT_PROJECT_ID,
      ii_derivation_origin:
        config.ii_derivation_origin === "undefined"
          ? undefined
          : config.ii_derivation_origin,
    };
    configCache = fullConfig;
    return fullConfig;
  } catch {
    const fallback: Config = {
      backend_host: undefined,
      backend_canister_id: backendCanisterId as string,
      storage_gateway_url: DEFAULT_STORAGE_GATEWAY_URL,
      bucket_name: DEFAULT_BUCKET_NAME,
      project_id: DEFAULT_PROJECT_ID,
    };
    configCache = fallback;
    return fallback;
  }
}
