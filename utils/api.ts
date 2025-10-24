import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com';

// ==================== AUTH HELPERS ====================

let authToken: string | null = null;
let userId: string | null = null;

export const initAuth = async () => {
  authToken = await AsyncStorage.getItem('auth_token');
  userId = await AsyncStorage.getItem('user_id');
};

const saveAuth = async (token: string, id: string) => {
  await AsyncStorage.multiSet([
    ['auth_token', token],
    ['user_id', id],
  ]);
  authToken = token;
  userId = id;
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove(['auth_token', 'user_id']);
  authToken = null;
  userId = null;
};

export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': authToken ? `Bearer ${authToken}` : '',
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password, displayName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    await saveAuth(data.token, data.user.id);
    return data.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (phoneNumber: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    await saveAuth(data.token, data.user.id);
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
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
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password change failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
};

// ==================== PROJECT PUBLISHING ====================

export const publishProject = async (projectData: {
  localProjectId: number;
  project: any;
  items: any[];
  settings?: any;
}) => {
  try {
    if (!isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/projects/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...projectData,
        userId: getCurrentUserId(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish project');
    }

    return await response.json();
  } catch (error) {
    console.error('Publish error:', error);
    throw error;
  }
};

export const unpublishProject = async (publishedProjectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${publishedProjectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unpublish project');
    }

    return await response.json();
  } catch (error) {
    console.error('Unpublish error:', error);
    throw error;
  }
};

export const updatePublishedProject = async (
  publishedProjectId: string,
  updates: any
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${publishedProjectId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return await response.json();
  } catch (error) {
    console.error('Update error:', error);
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
  sortBy?: 'recent' | 'popular' | 'trending';
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const response = await fetch(`${API_BASE_URL}/projects?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch projects error:', error);
    throw error;
  }
};

export const getPublishedProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch project error:', error);
    throw error;
  }
};

export const getPublishedProjectItems = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/items`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project items');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch items error:', error);
    throw error;
  }
};

// ==================== ENGAGEMENT ====================

export const likeProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to like project');
    }

    return await response.json();
  } catch (error) {
    console.error('Like error:', error);
    throw error;
  }
};

export const unlikeProject = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/like`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unlike project');
    }

    return await response.json();
  } catch (error) {
    console.error('Unlike error:', error);
    throw error;
  }
};

export const addComment = async (projectId: string, content: string, parentCommentId?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, parentCommentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Comment error:', error);
    throw error;
  }
};

export const getComments = async (projectId: string, page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/comments?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch comments error:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete comment error:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, content: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to update comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Update comment error:', error);
    throw error;
  }
};

// ==================== SOCIAL FEATURES ====================

export const followUser = async (followingId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${followingId}/follow`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to follow user');
    }

    return await response.json();
  } catch (error) {
    console.error('Follow error:', error);
    throw error;
  }
};

export const unfollowUser = async (followingId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${followingId}/follow`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unfollow user');
    }

    return await response.json();
  } catch (error) {
    console.error('Unfollow error:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch profile error:', error);
    throw error;
  }
};

export const getUserFollowers = async (userId: string, page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/followers?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch followers');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch followers error:', error);
    throw error;
  }
};

export const getUserFollowing = async (userId: string, page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/following?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch following');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch following error:', error);
    throw error;
  }
};

// ==================== READING HISTORY ====================

export const updateReadingProgress = async (
  projectId: string,
  itemId: string,
  progressPercentage: number
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reading/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId, itemId, progressPercentage }),
    });

    if (!response.ok) {
      throw new Error('Failed to update reading progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Update progress error:', error);
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
      throw new Error('Failed to fetch reading history');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch history error:', error);
    throw error;
  }
};

export const getReadingProgress = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reading/progress/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reading progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch progress error:', error);
    throw error;
  }
};

// ==================== ANALYTICS ====================

export const trackProjectView = async (projectId: string) => {
  try {
    await fetch(`${API_BASE_URL}/projects/${projectId}/view`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Track view error:', error);
  }
};

export const trackProjectDownload = async (projectId: string) => {
  try {
    await fetch(`${API_BASE_URL}/projects/${projectId}/download`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Track download error:', error);
  }
};

export const getProjectAnalytics = async (projectId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/analytics`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch analytics error:', error);
    throw error;
  }
};

// ==================== SEARCH & DISCOVERY ====================

export const searchPublishedWorks = async (query: string, filters?: {
  type?: string;
  genre?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const params = new URLSearchParams({ search: query });
    if (filters?.type) params.append('type', filters.type);
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/search?${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const getTrendingProjects = async (period: 'day' | 'week' | 'month' = 'week', limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trending?period=${period}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch trending projects');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch trending error:', error);
    throw error;
  }
};

export const getRecommendedProjects = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommended?limit=${limit}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch recommendations error:', error);
    throw error;
  }
};

// ==================== FILE UPLOAD ====================

export const uploadImage = async (imageUri: string, type: 'profile' | 'cover' | 'content') => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${type}_${Date.now()}.jpg`,
    } as any);
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// ==================== OFFLINE SYNC ====================

export const syncLocalChanges = async (syncQueue: any[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ changes: syncQueue }),
    });

    if (!response.ok) {
      throw new Error('Sync failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Sync error:', error);
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
      throw new Error('Failed to fetch updates');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch updates error:', error);
    throw error;
  }
};