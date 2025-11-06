import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://quilkalam-backend.vercel.app";

// ==================== AUTH HELPERS ====================

let authToken: string | null = null;
let userId: string | null = null;

export const initAuth = async () => {
  try {
    authToken = await AsyncStorage.getItem("auth_token");
    userId = await AsyncStorage.getItem("user_id");
  } catch (error) {
    console.error("Error initializing auth:", error);
  }
};

const saveAuth = async (token: string, id: string) => {
  try {
    await AsyncStorage.multiSet([
      ["auth_token", token],
      ["user_id", id],
    ]);
    authToken = token;
    userId = id;
  } catch (error) {
    console.error("Error saving auth:", error);
    throw error;
  }
};

export const clearAuth = async () => {
  try {
    await AsyncStorage.multiRemove(["auth_token", "user_id"]);
    authToken = null;
    userId = null;
  } catch (error) {
    console.error("Error clearing auth:", error);
  }
};

export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: authToken ? `Bearer ${authToken}` : "",
});

export const getCurrentUserId = () => userId;

export const isAuthenticated = () => !!authToken;

// ==================== AUTH OPERATIONS ====================

export const registerUser = async (
  phoneNumber: string,
  password: string,
  displayName?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Registration failed");
    }

    if (data.token && data.user) {
      await saveAuth(data.token, data.user.id);
    }

    return data.user;
  } catch (error: any) {
    console.error("Registration error:", error);
    // Return more specific error messages
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const loginUser = async (phoneNumber: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Login failed");
    }

    if (data.token && data.user) {
      await saveAuth(data.token, data.user.id);
    }

    return data.user;
  } catch (error: any) {
    console.error("Login error:", error);
    // Return more specific error messages
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const logoutUser = async () => {
  await clearAuth();
};

export const updateUserProfile = async (updates: {
  displayName?: string;
  email?: string;
  bio?: string;
  profileImage?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to update profile"
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Profile update error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Password change failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Password change error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};



// ==================== PROJECT PUBLISHING ====================

export const publishProject = async (projectData: {
  localProjectId: number;
  type: string;
  title: string;
  description?: string;
  genre?: string;
  authorName?: string;
  coverImage?: string;
  wordCount: number;
  items: any[];
  settings?: any;
}) => {
  try {
    if (!isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    const payload = {
      type: projectData.type,
      title: projectData.title,
      description: projectData.description,
      genre: projectData.genre,
      authorName: projectData.authorName,
      coverImage: projectData.coverImage,
      wordCount: projectData.wordCount,
      isbn: projectData.settings?.isbn,
      publisher: projectData.settings?.publisher,
      publicationDate: projectData.settings?.publication_date,
      price: projectData.settings?.price,
      language: projectData.settings?.language || "en",
      copyrightText: projectData.settings?.copyright_text,
      categories: projectData.settings?.categories?.split(",") || [],
      tags: projectData.settings?.tags?.split(",") || [],
      isPublic: projectData.settings?.is_public ?? true,
      allowComments: projectData.settings?.allow_comments ?? true,
      allowDownloads: projectData.settings?.allow_downloads ?? false,
      items: projectData.items.map((item) => ({
        parentItemId: item.parent_item_id,
        itemType: item.item_type,
        name: item.name,
        description: item.description,
        content: item.content,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
        orderIndex: item.order_index,
        depthLevel: item.depth_level,
        wordCount: item.word_count,
      })),
    };

    const response = await fetch(`${API_BASE_URL}/api/projects/publish`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to publish project"
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Publish error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const unpublishProject = async (publishedProjectId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${publishedProjectId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to unpublish project"
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Unpublish error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== BROWSE PUBLISHED WORKS ====================

export const getPublishedProjects = async (filters?: {
  genre?: string;
  type?: string;
  search?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular" | "trending";
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.genre) params.append("genre", filters.genre);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);

    const response = await fetch(`${API_BASE_URL}/api/projects?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to fetch projects"
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== CHAPTER OPERATIONS ====================

export const addChapter = async (
  projectId: string,
  chapterData: {
    name: string;
    content: string;
    description?: string;
    orderIndex: number;
    parentItemId?: string;
  }
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/chapters`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...chapterData,
          itemType: "chapter",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Failed to add chapter");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Add chapter error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== ENGAGEMENT ====================

export const likeProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Failed to like project");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Like error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const addComment = async (
  projectId: string,
  content: string,
  parentCommentId?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId, content, parentCommentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Failed to add comment");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Comment error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== SOCIAL FEATURES ====================

export const followUser = async (followingId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/follows`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ followingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Failed to follow user");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Follow error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== READING HISTORY ====================

export const updateReadingProgress = async (
  projectId: string,
  lastReadItemId: string,
  progressPercentage: number
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reading-progress`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId, lastReadItemId, progressPercentage }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to update reading progress"
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Update progress error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== FILE UPLOAD ====================
// @ts-ignore
import * as FileSystem from "expo-file-system";

export const convertImageToBase64 = async (
  imageUri: string
): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
};

export const uploadImage = async (
  imageUri: string,
  type: "profile" | "cover" | "content"
) => {
  try {
    const base64 = await convertImageToBase64(imageUri);

    const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        image: base64,
        folder: `quilkalam/${type}s`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "Image upload failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

// ==================== PROJECT PUBLISHING ====================

export const updatePublishedProject = async (
  publishedProjectId: string,
  updates: any
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${publishedProjectId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    return await response.json();
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

// ==================== BROWSE PUBLISHED WORKS ====================

export const getPublishedProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch project error:", error);
    throw error;
  }
};

export const getPublishedProjectItems = async (projectId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/items`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch project items");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch items error:", error);
    throw error;
  }
};

// ==================== ENGAGEMENT ====================

export const updateChapter = async (
  projectId: string,
  chapterId: string,
  updates: {
    name?: string;
    content?: string;
    description?: string;
    orderIndex?: number;
  }
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/chapters/${chapterId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update chapter");
    }

    return await response.json();
  } catch (error) {
    console.error("Update chapter error:", error);
    throw error;
  }
};

export const deleteChapter = async (projectId: string, chapterId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/chapters/${chapterId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete chapter");
    }

    return await response.json();
  } catch (error) {
    console.error("Delete chapter error:", error);
    throw error;
  }
};

export const getChapters = async (projectId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/chapters`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chapters");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch chapters error:", error);
    throw error;
  }
};

export const unlikeProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/likes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      throw new Error("Failed to unlike project");
    }

    return await response.json();
  } catch (error) {
    console.error("Unlike error:", error);
    throw error;
  }
};

export const getComments = async (projectId: string, page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/comments?projectId=${projectId}`, // Changed endpoint and params
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch comments");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch comments error:", error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/comments?id=${commentId}`,
      {
        // Changed to query param
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete comment");
    }

    return await response.json();
  } catch (error) {
    console.error("Delete comment error:", error);
    throw error;
  }
};

export const updateComment = async (commentId: string, content: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error("Failed to update comment");
    }

    return await response.json();
  } catch (error) {
    console.error("Update comment error:", error);
    throw error;
  }
};

// ==================== SOCIAL FEATURES ====================

export const unfollowUser = async (followingId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/follows`, {
      // Same endpoint, toggles
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ followingId }),
    });

    if (!response.ok) {
      throw new Error("Failed to unfollow user");
    }

    return await response.json();
  } catch (error) {
    console.error("Unfollow error:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch profile error:", error);
    throw error;
  }
};

export const getUserFollowers = async (
  userId: string,
  page = 1,
  limit = 20
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/followers?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch followers");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch followers error:", error);
    throw error;
  }
};

export const getUserFollowing = async (
  userId: string,
  page = 1,
  limit = 20
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/following?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch following");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch following error:", error);
    throw error;
  }
};

// ==================== READING HISTORY ====================

export const getReadingProgress = async (projectId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reading-progress?projectId=${projectId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch reading progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch progress error:", error);
    throw error;
  }
};

export const getReadingHistory = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reading/history?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch reading history");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch history error:", error);
    throw error;
  }
};

// ==================== ANALYTICS ====================

export const trackProjectView = async (projectId: string) => {
  try {
    await fetch(`${API_BASE_URL}/projects/${projectId}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Track view error:", error);
  }
};

export const trackProjectDownload = async (projectId: string) => {
  try {
    await fetch(`${API_BASE_URL}/projects/${projectId}/download`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Track download error:", error);
  }
};

export const getProjectAnalytics = async (projectId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/analytics`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch analytics");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch analytics error:", error);
    throw error;
  }
};

// ==================== SEARCH & DISCOVERY ====================

export const searchPublishedWorks = async (
  query: string,
  filters?: {
    type?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }
) => {
  try {
    const params = new URLSearchParams({ search: query });
    if (filters?.type) params.append("type", filters.type);
    if (filters?.genre) params.append("genre", filters.genre);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/search?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

export const getTrendingProjects = async (
  period: "day" | "week" | "month" = "week",
  limit = 10
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trending?period=${period}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trending projects");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch trending error:", error);
    throw error;
  }
};

export const getRecommendedProjects = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommended?limit=${limit}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch recommendations error:", error);
    throw error;
  }
};

// ==================== OFFLINE SYNC ====================

export const syncLocalChanges = async (syncQueue: any[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ changes: syncQueue }),
    });

    if (!response.ok) {
      throw new Error("Sync failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
};

export const getServerUpdates = async (lastSyncTime: number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sync/updates?since=${lastSyncTime}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch updates");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch updates error:", error);
    throw error;
  }
};
