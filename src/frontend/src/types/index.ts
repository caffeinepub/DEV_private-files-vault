export interface FileMetadata {
  id: string;
  name: string;
  size: bigint;
  mimeType: string;
  uploadedAt: bigint;
  blobKey: string;
}

export interface UserProfile {
  name: string;
}

export interface BackendActor {
  getCallerUserProfile(): Promise<UserProfile | null>;
  getUserProfile(user: unknown): Promise<UserProfile | null>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  listFiles(): Promise<FileMetadata[]>;
  isCallerAdmin(): Promise<boolean>;
  adminListAllFiles(): Promise<FileMetadata[]>;
  addFileMetadata(
    fileId: string,
    name: string,
    size: bigint,
    mimeType: string,
    blobKey: string,
  ): Promise<FileMetadata>;
  renameFile(fileId: string, newName: string): Promise<FileMetadata>;
  deleteFile(fileId: string): Promise<void>;
  _initializeAccessControlWithSecret(token: string): Promise<void>;
}
