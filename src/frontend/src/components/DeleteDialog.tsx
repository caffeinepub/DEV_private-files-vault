import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { useDeleteFile } from "../hooks/useQueries";

interface DeleteDialogProps {
  file: FileMetadata;
  onClose: () => void;
}

export default function DeleteDialog({ file, onClose }: DeleteDialogProps) {
  const deleteFile = useDeleteFile();

  const handleDelete = async () => {
    try {
      await deleteFile.mutateAsync(file.id);
      toast.success(`"${file.name}" deleted`);
      onClose();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent
        data-ocid="delete.dialog"
        className="bg-card border-border max-w-sm"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display font-700 text-foreground">
            Delete File?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            <span className="text-foreground font-600">
              &ldquo;{file.name}&rdquo;
            </span>{" "}
            will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2">
          <Button
            data-ocid="delete.cancel_button"
            variant="outline"
            onClick={onClose}
            disabled={deleteFile.isPending}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="delete.confirm_button"
            onClick={handleDelete}
            disabled={deleteFile.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display font-600"
          >
            {deleteFile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
