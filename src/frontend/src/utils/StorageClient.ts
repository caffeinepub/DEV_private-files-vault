import { type HttpAgent, isV3ResponseBody } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";

const GATEWAY_VERSION = "v1";
const SHA256_PREFIX = "sha256:";
const HASH_ALGORITHM = "SHA-256";
const DOMAIN_SEPARATOR_CHUNKS = new TextEncoder().encode("icfs-chunk/");
const DOMAIN_SEPARATOR_METADATA = new TextEncoder().encode("icfs-metadata/");
const DOMAIN_SEPARATOR_NODES = new TextEncoder().encode("ynode/");
const MAX_CONCURRENT_UPLOADS = 10;
const CHUNK_SIZE = 1024 * 1024;

function hexFrom(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const buf = new ArrayBuffer(data.length);
  new Uint8Array(buf).set(data);
  return new Uint8Array(
    await crypto.subtle.digest(HASH_ALGORITHM, buf),
  ) as Uint8Array<ArrayBuffer>;
}

async function hashChunk(data: Uint8Array): Promise<Uint8Array> {
  const combined = new Uint8Array(DOMAIN_SEPARATOR_CHUNKS.length + data.length);
  combined.set(DOMAIN_SEPARATOR_CHUNKS);
  combined.set(data, DOMAIN_SEPARATOR_CHUNKS.length);
  return sha256(combined);
}

async function hashNodes(
  left: Uint8Array | null,
  right: Uint8Array | null,
): Promise<Uint8Array> {
  const lb = left ?? new TextEncoder().encode("UNBALANCED");
  const rb = right ?? new TextEncoder().encode("UNBALANCED");
  const combined = new Uint8Array(
    DOMAIN_SEPARATOR_NODES.length + lb.length + rb.length,
  );
  combined.set(DOMAIN_SEPARATOR_NODES);
  combined.set(lb, DOMAIN_SEPARATOR_NODES.length);
  combined.set(rb, DOMAIN_SEPARATOR_NODES.length + lb.length);
  return sha256(combined);
}

async function hashHeaders(
  headers: Record<string, string>,
): Promise<Uint8Array> {
  const lines = Object.entries(headers)
    .map(([k, v]) => `${k.trim()}: ${v.trim()}\n`)
    .sort()
    .join("");
  const data = new TextEncoder().encode(lines);
  const combined = new Uint8Array(
    DOMAIN_SEPARATOR_METADATA.length + data.length,
  );
  combined.set(DOMAIN_SEPARATOR_METADATA);
  combined.set(data, DOMAIN_SEPARATOR_METADATA.length);
  return sha256(combined);
}

async function buildTree(
  chunkHashes: Uint8Array[],
  headers: Record<string, string> = {},
): Promise<{
  rootHash: Uint8Array;
  chunkHashStrings: string[];
  headerStrings: string[];
  treeJson: unknown;
}> {
  const chunkHashStrings = chunkHashes.map(
    (h) => `${SHA256_PREFIX}${hexFrom(h)}`,
  );

  type TreeNode = {
    hash: string;
    left: TreeNode | null;
    right: TreeNode | null;
  };

  let level: Array<{ hash: Uint8Array; node: TreeNode }> = chunkHashes.map(
    (h) => ({
      hash: h,
      node: { hash: `${SHA256_PREFIX}${hexFrom(h)}`, left: null, right: null },
    }),
  );

  if (level.length === 0) {
    const hex =
      "8b8e620f084e48da0be2287fd12c5aaa4dbe14b468fd2e360f48d741fe7628a0";
    const h = new TextEncoder().encode(hex);
    level = [
      {
        hash: h,
        node: { hash: `${SHA256_PREFIX}${hex}`, left: null, right: null },
      },
    ];
  }

  while (level.length > 1) {
    const next: typeof level = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i];
      const r = level[i + 1] ?? null;
      const ph = await hashNodes(l.hash, r?.hash ?? null);
      next.push({
        hash: ph,
        node: {
          hash: `${SHA256_PREFIX}${hexFrom(ph)}`,
          left: l.node,
          right: r?.node ?? null,
        },
      });
    }
    level = next;
  }

  const chunksRoot = level[0];
  const headerStrings = Object.entries(headers)
    .map(([k, v]) => `${k.trim()}: ${v.trim()}`)
    .sort();

  let finalRootHash = chunksRoot.hash;
  let finalTree: TreeNode = chunksRoot.node;

  if (headerStrings.length > 0) {
    const mh = await hashHeaders(headers);
    const mNode: TreeNode = {
      hash: `${SHA256_PREFIX}${hexFrom(mh)}`,
      left: null,
      right: null,
    };
    const cr = await hashNodes(chunksRoot.hash, mh);
    finalRootHash = cr;
    finalTree = {
      hash: `${SHA256_PREFIX}${hexFrom(cr)}`,
      left: chunksRoot.node,
      right: mNode,
    };
  }

  return {
    rootHash: finalRootHash,
    chunkHashStrings,
    headerStrings,
    treeJson: {
      tree_type: "DSBMTWH",
      chunk_hashes: chunkHashStrings,
      tree: finalTree,
      headers: headerStrings,
    },
  };
}

export class StorageClient {
  private readonly gatewayUrl: string;

  constructor(
    private readonly bucket: string,
    gatewayUrl: string,
    private readonly canisterId: string,
    private readonly projectId: string,
    private readonly agent: HttpAgent,
  ) {
    this.gatewayUrl = gatewayUrl;
  }

  async putFile(
    bytes: Uint8Array,
    onProgress?: (pct: number) => void,
  ): Promise<{ hash: string }> {
    const fileHeaders: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Content-Length": bytes.length.toString(),
    };

    const chunkCount = Math.ceil(bytes.length / CHUNK_SIZE) || 1;
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < chunkCount; i++) {
      chunks.push(bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }

    const chunkHashes: Uint8Array[] = await Promise.all(chunks.map(hashChunk));
    const { rootHash, chunkHashStrings, treeJson } = await buildTree(
      chunkHashes,
      fileHeaders,
    );
    const hashStr = `${SHA256_PREFIX}${hexFrom(rootHash)}`;

    const certBytes = await this.getCertificate(hashStr);
    await this.uploadBlobTree(treeJson, bytes.length, hashStr, certBytes);

    let completed = 0;
    const uploadOne = async (idx: number) => {
      await this.uploadChunk(hashStr, chunkHashStrings[idx], idx, chunks[idx]);
      completed++;
      onProgress?.(Math.round((completed / chunks.length) * 100));
    };

    await Promise.all(
      Array.from({ length: MAX_CONCURRENT_UPLOADS }, async (_, w) => {
        for (let i = w; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
          await uploadOne(i);
        }
      }),
    );

    return { hash: hashStr };
  }

  async getDirectURL(hash: string): Promise<string> {
    return `${this.gatewayUrl}/${GATEWAY_VERSION}/blob/?blob_hash=${encodeURIComponent(hash)}&owner_id=${encodeURIComponent(this.canisterId)}&project_id=${encodeURIComponent(this.projectId)}`;
  }

  private async getCertificate(hash: string): Promise<Uint8Array> {
    const args = IDL.encode([IDL.Text], [hash]);
    const result = await this.agent.call(this.canisterId, {
      methodName: "_caffeineStorageCreateCertificate",
      arg: args,
    });
    const body = result.response.body;
    if (isV3ResponseBody(body)) return body.certificate;
    throw new Error("Expected v3 response body");
  }

  private async uploadBlobTree(
    treeJson: unknown,
    numBytes: number,
    _rootHash: string,
    certBytes: Uint8Array,
  ): Promise<void> {
    const url = `${this.gatewayUrl}/${GATEWAY_VERSION}/blob-tree/`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Caffeine-Project-ID": this.projectId,
      },
      body: JSON.stringify({
        blob_tree: treeJson,
        bucket_name: this.bucket,
        num_blob_bytes: numBytes,
        owner: this.canisterId,
        project_id: this.projectId,
        auth: { OwnerEgressSignature: Array.from(certBytes) },
      }),
    });
    if (!res.ok) throw new Error(`uploadBlobTree failed: ${res.status}`);
  }

  private async uploadChunk(
    blobHash: string,
    chunkHash: string,
    idx: number,
    data: Uint8Array,
  ): Promise<void> {
    const params = new URLSearchParams({
      owner_id: this.canisterId,
      blob_hash: blobHash,
      chunk_hash: chunkHash,
      chunk_index: idx.toString(),
      bucket_name: this.bucket,
      project_id: this.projectId,
    });
    const res = await fetch(
      `${this.gatewayUrl}/${GATEWAY_VERSION}/chunk/?${params}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Caffeine-Project-ID": this.projectId,
        },
        body: data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        ) as BodyInit,
      },
    );
    if (!res.ok) throw new Error(`uploadChunk ${idx} failed: ${res.status}`);
  }
}
