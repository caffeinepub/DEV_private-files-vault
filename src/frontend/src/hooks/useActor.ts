import type { Identity } from "@icp-sdk/core/agent";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ExternalBlob, createActor } from "../backend";
import type { BackendActor } from "../types";
import { StorageClient } from "../utils/StorageClient";
import { loadConfig } from "../utils/config";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
const SENTINEL = "!caf!";

function extractAgentErrorMessage(error: string): string {
  const errorString = String(error);
  const match = errorString.match(/with message:\s*'([^']+)'/s);
  return match ? match[1] : errorString;
}

function processError(e: unknown): never {
  if (e && typeof e === "object" && "message" in e) {
    throw new Error(
      extractAgentErrorMessage(`${(e as { message: unknown }).message}`),
    );
  }
  throw e;
}

async function buildActor(identity?: Identity): Promise<BackendActor> {
  const config = await loadConfig();
  const agent = new HttpAgent({
    identity: identity ?? undefined,
    host: config.backend_host,
  });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }

  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  const uploadFile = async (file: ExternalBlob): Promise<Uint8Array> => {
    const bytes = await file.getBytes();
    const { hash } = await storageClient.putFile(bytes);
    return new TextEncoder().encode(SENTINEL + hash);
  };

  const downloadFile = async (bytes: Uint8Array): Promise<ExternalBlob> => {
    const hashWithPrefix = new TextDecoder().decode(new Uint8Array(bytes));
    const hash = hashWithPrefix.substring(SENTINEL.length);
    const url = await storageClient.getDirectURL(hash);
    return ExternalBlob.fromURL(url);
  };

  return createActor(config.backend_canister_id, uploadFile, downloadFile, {
    agent,
    processError,
  }) as unknown as BackendActor;
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<BackendActor>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: () => buildActor(identity ?? undefined),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}
