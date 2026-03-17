import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface FileMetadata {
    id: string;
    blobKey: string;
    name: string;
    size: bigint;
    mimeType: string;
    uploadedAt: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFileMetadata(fileId: string, name: string, size: bigint, mimeType: string, blobKey: string): Promise<FileMetadata>;
    adminListAllFiles(): Promise<Array<FileMetadata>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFile(fileId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listFiles(): Promise<Array<FileMetadata>>;
    renameFile(fileId: string, newName: string): Promise<FileMetadata>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
