import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useRenameFile } from "../hooks/useQueries";

interface RenameDialogProps {
  file: FileMetadata;
  onClose: () => void;
}

export default function RenameDialog({ file, onClose }: RenameDialogProps) {
  const [name, setName] = useState(file.name);
  const rename = useRenameFile();

  useEffect(() => {
    setName(file.name);
  }, [file.name]);

  const handleSave = async () => {
    if (!name.trim() || name === file.name) return;
    try {
      await rename.mutateAsync({ fileId: file.id, newName: name.trim() });
      toast.success("File renamed");
      onClose();
    } catch {
      toast.error("Failed to rename file");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="rename.dialog"
        className="bg-card border-border max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-700 text-foreground">
            Rename File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">File name</Label>
          <Input
            data-ocid="rename.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="bg-input border-border text-foreground focus:border-primary"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            data-ocid="rename.cancel_button"
            variant="outline"
            onClick={onClose}
            disabled={rename.isPending}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="rename.save_button"
            onClick={handleSave}
            disabled={!name.trim() || name === file.name || rename.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600"
          >
            {rename.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
