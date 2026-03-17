import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useRef } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

export function useBlobStorage() {
  const { identity } = useInternetIdentity();
  const configRef = useRef<Awaited<ReturnType<typeof loadConfig>> | null>(null);

  const getClient = useCallback(async () => {
    if (!configRef.current) {
      configRef.current = await loadConfig();
    }
    const config = configRef.current;
    const agent = new HttpAgent({
      identity: identity ?? undefined,
      host: config.backend_host,
    });
    if (config.backend_host?.includes("localhost")) {
      await agent.fetchRootKey().catch(() => {});
    }
    return new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
  }, [identity]);

  const upload = useCallback(
    async (file: File, onProgress?: (pct: number) => void) => {
      const client = await getClient();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes, onProgress);
      return { key: hash };
    },
    [getClient],
  );

  const getUrl = useCallback(
    async (key: string) => {
      const client = await getClient();
      return client.getDirectURL(key);
    },
    [getClient],
  );

  return { upload, getUrl };
}
