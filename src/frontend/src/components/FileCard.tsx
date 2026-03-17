import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useBlobStorage } from "../hooks/useBlobStorage";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.startsWith("text/")) return FileText;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return FileArchive;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
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
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "Just now";
  if (hours < 1) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface FileCardProps {
  file: FileMetadata;
  index: number;
  onRename: (file: FileMetadata) => void;
  onDelete: (file: FileMetadata) => void;
}

export default function FileCard({
  file,
  index,
  onRename,
  onDelete,
}: FileCardProps) {
  const [downloading, setDownloading] = useState(false);
  const { getUrl } = useBlobStorage();
  const Icon = getFileIcon(file.mimeType);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getUrl(file.blobKey);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to get download URL");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      data-ocid={`files.item.${index}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="vault-card rounded-lg p-4 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem
              onClick={handleDownload}
              className="cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              data-ocid={`files.edit_button.${index}`}
              onClick={() => onRename(file)}
              className="cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              data-ocid={`files.delete_button.${index}`}
              onClick={() => onDelete(file)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-display font-600 text-sm text-foreground truncate leading-snug"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5 font-mono">
          {formatSize(file.size)}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-muted-foreground text-xs">
          {formatDate(file.uploadedAt)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-display"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          {downloading ? "..." : "Get"}
        </Button>
      </div>
    </motion.div>
  );
}
