import {
  getCurrentUser,
  updateUserProfile as updateLocalProfile,
} from "./database";
import {
  updateUserProfile as updateRemoteProfile,
  isAuthenticated,
} from "./api";

// ==================== SYNC STATUS ====================

export const getSyncStatus = async () => {
  const hasAuth = isAuthenticated();
  const localUser = getCurrentUser();

  return {
    isAuthenticated: hasAuth,
    hasLocalUser: !!localUser,
    canSync: hasAuth && !!localUser,
  };
};

// ==================== USER PROFILE SYNC ====================

export const syncUserProfile = async (profileData: {
  displayName?: string;
  email?: string;
  bio?: string;
  profileImageUri?: string;
}) => {
  const localUser = getCurrentUser();
  if (!localUser) {
    throw new Error("No local user found");
  }

  try {
    // Always update local first (works offline)
    updateLocalProfile(localUser.id, profileData);

    // Try to sync to remote if online
    const status = await getSyncStatus();
    if (status.canSync) {
      try {
        await updateRemoteProfile({
          displayName: profileData.displayName,
          email: profileData.email,
          bio: profileData.bio,
          profileImage: profileData.profileImageUri,
        });
        return { synced: true, local: true, remote: true };
      } catch (remoteError) {
        console.error("Remote sync failed:", remoteError);
        return { synced: false, local: true, remote: false };
      }
    }

    return { synced: false, local: true, remote: false };
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
};

// ==================== PROJECT SYNC ====================

export const syncProject = async (projectId: number) => {
  const status = await getSyncStatus();

  if (!status.canSync) {
    throw new Error(
      "Cannot sync: " +
        (!status.isAuthenticated ? "Not authenticated" : "No local user")
    );
  }

  // Implementation for syncing projects
  // This would get project data from local DB and send to remote
  console.log("Syncing project:", projectId);
  // TODO: Implement full project sync
};

// ==================== QUEUE MANAGEMENT ====================

export const processSyncQueue = async () => {
  const status = await getSyncStatus();

  if (!status.canSync) {
    console.log("Skipping sync queue - not ready");
    return { processed: 0, failed: 0 };
  }

  // Get items from sync queue and process them
  // TODO: Implement queue processing
  return { processed: 0, failed: 0 };
};

// ==================== AUTO SYNC ====================

let syncInterval: NodeJS.Timeout | null = null;

export const startAutoSync = (intervalMinutes: number = 15) => {
  if (syncInterval) {
    stopAutoSync();
  }

  syncInterval = setInterval(async () => {
    try {
      await processSyncQueue();
    } catch (error) {
      console.error("Auto sync error:", error);
    }
  }, intervalMinutes * 60 * 1000);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
