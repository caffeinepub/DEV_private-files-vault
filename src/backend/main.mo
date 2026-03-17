import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Blob "mo:core/Blob";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type FileMetadata = {
    id : Text;
    name : Text;
    size : Nat;
    mimeType : Text;
    uploadedAt : Int;
    blobKey : Text;
  };

  public type UserFiles = {
    files : Map.Map<Text, FileMetadata>;
  };

  public type UserProfile = {
    name : Text;
  };

  let userFiles = Map.empty<Principal, UserFiles>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getUserFilesInternal(user : Principal) : UserFiles {
    switch (userFiles.get(user)) {
      case (null) { Runtime.trap("User has no files") };
      case (?files) { files };
    };
  };

  func getFileInternal(fileId : Text) : FileMetadata {
    for ((_, files) in userFiles.entries()) {
      switch (files.files.get(fileId)) {
        case (?file) { return file };
        case (null) {};
      };
    };
    Runtime.trap("File not found");
  };

  func assertFileOwnerIsCaller(fileId : Text, caller : Principal) {
    let userFilesLocal = getUserFilesInternal(caller);
    if (not userFilesLocal.files.containsKey(fileId)) {
      Runtime.trap("Unauthorized: Only the owner can modify this file");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func listFiles() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list files");
    };
    let userFilesLocal = getUserFilesInternal(caller);
    userFilesLocal.files.values().toArray();
  };

  public query ({ caller }) func adminListAllFiles() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let allFilesList = List.empty<FileMetadata>();
    for ((_, userFile) in userFiles.entries()) {
      let filesArray = userFile.files.values().toArray();
      allFilesList.addAll(filesArray.values());
    };
    allFilesList.toArray();
  };

  public shared ({ caller }) func addFileMetadata(
    fileId : Text,
    name : Text,
    size : Nat,
    mimeType : Text,
    blobKey : Text,
  ) : async FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add files");
    };

    let fileMetadata = {
      id = fileId;
      name;
      size;
      mimeType;
      uploadedAt = Time.now();
      blobKey;
    };

    switch (userFiles.get(caller)) {
      case (null) {
        let newUserFiles : UserFiles = {
          files = Map.singleton(fileId, fileMetadata);
        };
        userFiles.add(caller, newUserFiles);
      };
      case (?userFilesLocal) {
        if (userFilesLocal.files.containsKey(fileId)) {
          Runtime.trap("File with this id already exists");
        };
        userFilesLocal.files.add(fileId, fileMetadata);
      };
    };
    fileMetadata;
  };

  public shared ({ caller }) func renameFile(fileId : Text, newName : Text) : async FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can rename files");
    };
    assertFileOwnerIsCaller(fileId, caller);
    let userFilesLocal = getUserFilesInternal(caller);

    switch (userFilesLocal.files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?existingFile) {
        let updatedFile = {
          id = existingFile.id;
          name = newName;
          size = existingFile.size;
          mimeType = existingFile.mimeType;
          uploadedAt = existingFile.uploadedAt;
          blobKey = existingFile.blobKey;
        };

        userFilesLocal.files.add(fileId, updatedFile);

        updatedFile;
      };
    };
  };

  public shared ({ caller }) func deleteFile(fileId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete files");
    };
    assertFileOwnerIsCaller(fileId, caller);
    let userFilesLocal = getUserFilesInternal(caller);
    if (not userFilesLocal.files.containsKey(fileId)) {
      Runtime.trap("File not found");
    };
    userFilesLocal.files.remove(fileId);
  };
};
