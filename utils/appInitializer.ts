import { initDB, getCurrentUser } from "./database";
import { initAuth, isAuthenticated } from "./api";
import { getSyncStatus, startAutoSync } from "./syncHelper";

// ==================== APP INITIALIZATION ====================
let initialized = false;
export const initializeApp = async () => {
  try {
    if (initialized) {
      console.log("⚙️ App already initialized — skipping");
      return getAppState();
    }

    initialized = true;

    console.log("🚀 Initializing QuillKalam...");

    // Step 1: Initialize local database
    console.log("📦 Initializing local database...");
    initDB();
    console.log("✅ Local database ready");

    // Step 2: Initialize authentication
    console.log("🔐 Checking authentication...");
    await initAuth();

    const localUser = getCurrentUser();
    const hasRemoteAuth = isAuthenticated();

    console.log("User status:", {
      hasLocalUser: !!localUser,
      hasRemoteAuth,
    });

    // Step 3: Check sync status
    const syncStatus = await getSyncStatus();
    console.log("Sync status:", syncStatus);

    // Step 4: Start auto-sync if possible
    if (syncStatus.canSync) {
      console.log("🔄 Starting auto-sync...");
      startAutoSync(15); // Sync every 15 minutes
    } else {
      console.log("📴 Running in offline mode");
    }

    console.log("✅ App initialized successfully");

    return {
      initialized: true,
      user: localUser,
      isOnline: true,
      canSync: syncStatus.canSync,
    };
  } catch (error) {
    console.error("❌ App initialization error:", error);
    throw error;
  }
};

// ==================== SESSION HELPERS ====================

export const getAppState = () => {
  const localUser = getCurrentUser();
  const hasAuth = isAuthenticated();

  return {
    isLoggedIn: !!localUser,
    hasRemoteAuth: hasAuth,
    user: localUser,
    needsSync: !!localUser && !hasAuth,
  };
};

export const refreshAppState = async () => {
  await initAuth();
  return getAppState();
};
