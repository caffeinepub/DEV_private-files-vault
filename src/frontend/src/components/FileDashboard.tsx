import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Lock, LogOut, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { FileMetadata } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useIsCallerAdmin,
  useListFiles,
} from "../hooks/useQueries";
import AdminPanel from "./AdminPanel";
import DeleteDialogLazy from "./DeleteDialog";
import FileCard from "./FileCard";
import RenameDialogLazy from "./RenameDialog";
import UploadModal from "./UploadModal";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

export default function FileDashboard() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameFile, setRenameFile] = useState<FileMetadata | null>(null);
  const [deleteFile, setDeleteFile] = useState<FileMetadata | null>(null);

  const { data: files, isLoading } = useListFiles();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: profile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const principalShort = `${identity?.getPrincipal().toString().slice(0, 8)}...`;
  const displayName = profile?.name || principalShort;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-700 text-lg tracking-tight text-foreground">
              Vault
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm hidden sm:block font-mono">
              {displayName}
            </span>
            <Button
              data-ocid="auth.logout_button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <Tabs defaultValue="files">
          {isAdmin && (
            <TabsList className="mb-6 bg-muted border border-border">
              <TabsTrigger value="files" className="font-display font-600">
                My Files
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                data-ocid="admin.tab"
                className="font-display font-600"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="files" className="mt-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display font-700 text-2xl text-foreground tracking-tight">
                  My Files
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {files?.length ?? 0} file{files?.length !== 1 ? "s" : ""}{" "}
                  stored
                </p>
              </div>
              <Button
                data-ocid="files.upload_button"
                onClick={() => setUploadOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div
                data-ocid="files.loading_state"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {SKELETON_KEYS.map((k) => (
                  <div key={k} className="vault-card rounded-lg p-5 space-y-3">
                    <Skeleton className="h-10 w-10 rounded bg-muted" />
                    <Skeleton className="h-4 w-3/4 rounded bg-muted" />
                    <Skeleton className="h-3 w-1/2 rounded bg-muted" />
                    <Skeleton className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && files?.length === 0 && (
              <motion.div
                data-ocid="files.empty_state"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-600 text-foreground">
                    Vault is empty
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Upload your first file to get started.
                  </p>
                </div>
                <Button
                  data-ocid="files.upload_button"
                  onClick={() => setUploadOpen(true)}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-display"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </motion.div>
            )}

            {/* File grid */}
            {!isLoading && files && files.length > 0 && (
              <AnimatePresence>
                <div
                  data-ocid="files.list"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {files.map((file, index) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      index={index + 1}
                      onRename={setRenameFile}
                      onDelete={setDeleteFile}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-0">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border/50">
        <p className="text-muted-foreground text-xs text-center">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {renameFile && (
        <RenameDialogLazy
          file={renameFile}
          onClose={() => setRenameFile(null)}
        />
      )}
      {deleteFile && (
        <DeleteDialogLazy
          file={deleteFile}
          onClose={() => setDeleteFile(null)}
        />
      )}
    </div>
  );
}
