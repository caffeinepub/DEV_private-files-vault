import { Skeleton } from "@/components/ui/skeleton";
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import type { FileMetadata } from "../backend.d";
import { useAdminListAllFiles } from "../hooks/useQueries";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4"];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.startsWith("text/")) return FileText;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return FileArchive;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("html")
  )
    return FileCode;
  return File;
}

function formatSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPanel() {
  const { data: files, isLoading } = useAdminListAllFiles();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-700 text-xl text-foreground tracking-tight">
            All Files
          </h2>
          <p className="text-muted-foreground text-sm">
            {files?.length ?? 0} total file{files?.length !== 1 ? "s" : ""}{" "}
            across all users
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="h-14 w-full rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && files?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No files found across all users.
        </div>
      )}

      {!isLoading && files && files.length > 0 && (
        <div data-ocid="admin.list" className="space-y-2">
          {files.map((file: FileMetadata, i: number) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="vault-card rounded-lg px-4 py-3 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-600 text-sm text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono">
                    {file.id.slice(0, 12)}... · {formatSize(file.size)}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs text-right hidden sm:block">
                  <p>{formatDate(file.uploadedAt)}</p>
                  <p className="text-xs opacity-60 truncate max-w-[120px]">
                    {file.mimeType}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
