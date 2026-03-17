import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, FileIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useAddFileMetadata } from "../hooks/useQueries";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload } = useBlobStorage();
  const addMetadata = useAddFileMetadata();

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setProgress(0);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const handleClose = useCallback(() => {
    if (status === "uploading") return;
    resetState();
    onClose();
  }, [status, resetState, onClose]);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    setStatus("idle");
    setProgress(0);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      const { key } = await upload(selectedFile, (pct) => setProgress(pct));
      const fileId = crypto.randomUUID();
      await addMetadata.mutateAsync({
        fileId,
        name: selectedFile.name,
        size: BigInt(selectedFile.size),
        mimeType: selectedFile.type || "application/octet-stream",
        blobKey: key,
      });
      setStatus("success");
      toast.success(`"${selectedFile.name}" uploaded successfully`);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMsg(msg);
      toast.error("Upload failed");
    }
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        data-ocid="upload.dialog"
        className="bg-card border-border max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-700 text-foreground">
            Upload to Vault
          </DialogTitle>
        </DialogHeader>

        {/* Dropzone - using label for native keyboard + click support */}
        <label
          data-ocid="files.dropzone"
          htmlFor="vault-file-input"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 block",
            dragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            status === "uploading" && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={fileInputRef}
            id="vault-file-input"
            type="file"
            className="hidden"
            onChange={handleInputChange}
          />
          {selectedFile ? (
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-600 text-sm text-foreground truncate">
                  {selectedFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatSize(selectedFile.size)}
                </p>
              </div>
              {status === "idle" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    resetState();
                  }}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-display font-600">
                  Click to browse
                </span>{" "}
                or drag &amp; drop
              </p>
              <p className="text-xs text-muted-foreground/60">Any file type</p>
            </div>
          )}
        </label>

        {/* Progress */}
        {status === "uploading" && (
          <div data-ocid="upload.loading_state" className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-muted" />
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div
            data-ocid="upload.success_state"
            className="flex items-center gap-2 text-sm text-green-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Uploaded successfully!</span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div
            data-ocid="upload.error_state"
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="line-clamp-2">{errorMsg}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            data-ocid="upload.cancel_button"
            variant="outline"
            onClick={handleClose}
            disabled={status === "uploading"}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="upload.submit_button"
            onClick={handleUpload}
            disabled={
              !selectedFile || status === "uploading" || status === "success"
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600"
          >
            {status === "uploading" ? (
              <>
                <span className="mr-2 inline-block w-3 h-3 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
