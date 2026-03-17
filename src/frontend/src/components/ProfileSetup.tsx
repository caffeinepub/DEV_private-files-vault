import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className="bg-card border-border max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="font-display font-700 text-foreground">
              Welcome to Vault
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Set a display name for your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label
            htmlFor="display-name"
            className="text-muted-foreground text-sm"
          >
            Display name
          </Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Alex Morgan"
            className="bg-input border-border text-foreground focus:border-primary"
            autoFocus
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || saveProfile.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600"
        >
          {saveProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Enter Vault"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
