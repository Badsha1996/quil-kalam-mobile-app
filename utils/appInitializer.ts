import { initDB, getCurrentUser } from "./database";
import { initAuth, isAuthenticated } from "./api";

// ==================== APP INITIALIZATION ====================
let initialized = false;

export const initializeApp = async () => {
  try {
    if (initialized) {
      console.log("⚙️ App already initialized — returning state");
      return getAppState();
    }

    console.log("🚀 Initializing QuillKalam...");

    // Step 1: Initialize local database
    console.log("📦 Initializing local database...");
    try {
      initDB();
      console.log("✅ Local database ready");
    } catch (dbError) {
      console.error("❌ Database initialization failed:", dbError);
      throw new Error("Failed to initialize database");
    }

    // Step 2: Initialize authentication
    console.log("🔐 Checking authentication...");
    const authResult = await initAuth();

    // Step 3: Get current user with better error handling
    let localUser = null;
    let userLoadError = null;

    try {
      localUser = await getCurrentUser();
      console.log(
        "👤 User loaded:",
        localUser ? `Yes (${localUser.displayName})` : "No"
      );
    } catch (userError) {
      console.error("❌ Error loading user:", userError);
      userLoadError = userError;
      // Continue without user - app can work in offline mode
    }

    const hasRemoteAuth = isAuthenticated();

    // Step 4: Check sync status (only if authenticated and user loaded)
    // let syncStatus = { canSync: false, lastSync: null };
    // if (hasRemoteAuth && localUser && !userLoadError) {
    //   try {
    //     // @ts-ignore
    //     // syncStatus = await getSyncStatus();
    //   } catch (syncError) {
    //     console.warn("⚠️ Could not check sync status:", syncError);
    //   }
    // }

   

    initialized = true;

    return {
      initialized: true,
      user: localUser,
      isOnline: true,
      canSync: false,
      isLoggedIn: !!localUser && hasRemoteAuth && !userLoadError,
      userLoadError: userLoadError,
    };
  } catch (error) {
    console.error("❌ App initialization error:", error);
    // Don't throw - allow app to start in offline mode
    return {
      initialized: false,
      user: null,
      isOnline: false,
      canSync: false,
      isLoggedIn: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ==================== SESSION HELPERS ====================

export const getAppState = async () => {
  try {
    const localUser = await getCurrentUser();
    const hasAuth = isAuthenticated();

    return {
      isLoggedIn: !!localUser && hasAuth,
      hasRemoteAuth: hasAuth,
      user: localUser,
      needsSync: !!localUser && !hasAuth,
    };
  } catch (error) {
    console.error("Error getting app state:", error);
    return {
      isLoggedIn: false,
      hasRemoteAuth: false,
      user: null,
      needsSync: false,
    };
  }
};

export const refreshAppState = async () => {
  try {
    await initAuth();
    return getAppState();
  } catch (error) {
    console.error("Error refreshing app state:", error);
    return getAppState(); // Return current state even if refresh fails
  }
};

// Add this helper to reset initialization state (useful for logout)
export const resetInitialization = () => {
  initialized = false;
  console.log("🔄 App initialization state reset");
};
