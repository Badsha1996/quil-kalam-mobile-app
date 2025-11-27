import Background from "@/components/common/Background";
import GlobalAlert from "@/components/common/GlobalAlert";
import KeyboardAvoidingLayout from "@/components/common/KeyboardAvoidingLayout";
import { clearAuth, updateUserProfile } from "@/utils/api";
import {
  getAllProjects,
  getCurrentUser,
  getSetting,
  getStats,
  updateDailyGoal,
  clearActiveSession,
  exportAllDataAsJSON,
  importAllDataFromJSON,
} from "@/utils/database";

import { File, Directory, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

// @ts-ignore
import * as ImagePicker from "expo-image-picker";
// @ts-ignore
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

const Profile = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    bio: "",
  });
  const [dailyGoal, setDailyGoal] = useState(500);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      console.log(user, "***************");

      const statsData = getStats();
      const projectsData = getAllProjects();
      setStats(statsData);
      setProjects(projectsData as any[]);

      if (currentUser) {
        setEditForm({
          displayName: currentUser.display_name || "",
          email: currentUser.email || "",
          bio: currentUser.bio || "",
        });
      } else {
        console.log("⚠️ No user data available for profile");
      }
    } catch (error) {
      console.error("❌ Error loading profile data:", error);

      setUser(null);
    } finally {
      setLoading(true);
    }
  };

  const loadSettings = () => {
    try {
      const savedGoal = getSetting("daily_goal", "500");
      // @ts-ignore
      const goalValue = parseInt(savedGoal);

      if (!isNaN(goalValue) && goalValue > 0) {
        setDailyGoal(goalValue);
      } else {
        setDailyGoal(500);
        updateDailyGoal(500);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setDailyGoal(500);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfile({
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim() || "guestuser@quilkalam.com",
        bio: editForm.bio.trim(),
      });

      GlobalAlert.show({
        title: "Success",
        message: "Profile updated successfully!",
        primaryText: "Okay",
      });

      // Refresh user data
      loadData();
      setIsEditingProfile(false);
    } catch (error: any) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to update profile",
        primaryText: "Okay",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) {
      GlobalAlert.show({
        title: "Error",
        message: "Please login to update profile picture",
        primaryText: "Okay",
      });
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        GlobalAlert.show({
          title: "Permission needed",
          message:
            "Please grant camera roll permissions to update your profile picture",
          primaryText: "Okay",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUploadingImage(true);

        try {
          await updateUserProfile({
            profileImage: `data:image/jpeg;base64,${result.assets[0].base64}`,
          });

          await loadData();

          GlobalAlert.show({
            title: "Success",
            message: "Profile picture updated!",
            primaryText: "Okay",
          });
        } catch (error: any) {
          GlobalAlert.show({
            title: "Error",
            message: "Failed to update profile picture",
            primaryText: "Okay",
          });
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      setIsUploadingImage(false);
      GlobalAlert.show({
        title: "Error",
        message: "Failed to update profile picture",
        primaryText: "Okay",
      });
    }
  };

  const handleUpdateDailyGoal = (newGoal: number) => {
    if (newGoal < 1) {
      GlobalAlert.show({
        title: "Error",
        message: "Daily goal must be at least 1 word",
        primaryText: "Okay",
      });
      return;
    }

    if (newGoal > 100000) {
      GlobalAlert.show({
        title: "Error",
        message: "Daily goal cannot exceed 100,000 words",
        primaryText: "Okay",
      });
      return;
    }

    try {
      updateDailyGoal(newGoal);
      setDailyGoal(newGoal);

      GlobalAlert.show({
        title: "Success",
        message: `Daily goal set to ${newGoal.toLocaleString()} words!`,
        primaryText: "Okay",
      });
    } catch (error) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to update daily goal",
        primaryText: "Okay",
      });
    }
  };

  const handleEditDailyGoal = () => {
    setTempGoal(dailyGoal.toString());
    setShowGoalEditor(true);
  };

  const handleSaveDailyGoal = () => {
    if (tempGoal && tempGoal.trim()) {
      const num = parseInt(tempGoal.trim());
      if (!isNaN(num) && num > 0 && num <= 100000) {
        handleUpdateDailyGoal(num);
        setShowGoalEditor(false);
      } else {
        GlobalAlert.show({
          title: "Error",
          message: "Please enter a valid number between 1 and 100,000",
          primaryText: "Okay",
        });
      }
    } else {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter a valid number",
        primaryText: "Okay",
      });
    }
  };

  const handleCancelDailyGoal = () => {
    setShowGoalEditor(false);
    setTempGoal("");
  };

  const handleExportData = async () => {
    try {
      GlobalAlert.show({
        title: "Exporting Data",
        message: "Please wait while we prepare your data...",
        primaryText: "Okay",
      });

      // Get all data as JSON
      const jsonData = await exportAllDataAsJSON();

      if (!jsonData) {
        throw new Error("Failed to export data");
      }

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `quilkalam-backup-${timestamp}.json`;

      // Use the new File API
      const file = new File(Paths.document, filename);
      await file.create();
      await file.write(jsonData);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Save QuillKalam Backup",
          UTI: "public.json",
        });

        GlobalAlert.show({
          title: "Success",
          message:
            "Your data has been exported successfully! Save the file to import it later.",
          primaryText: "Okay",
        });
      } else {
        GlobalAlert.show({
          title: "Export Complete",
          message: `Data saved to: ${file.uri}`,
          primaryText: "Okay",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      GlobalAlert.show({
        title: "Export Failed",
        message: "Failed to export data. Please try again.",
        primaryText: "Okay",
      });
    }
  };

  const handleImportData = async () => {
    try {
      // Pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;

      GlobalAlert.show({
        title: "Import Data",
        message:
          "This will import all projects and settings from the backup file. Your existing data will be preserved. Continue?",
        primaryText: "Cancel",
        secondaryText: "Import",
        onSecondary: async () => {
          try {
            setLoading(true);

            // Read file content using new API
            const file = new File(fileUri);
            const fileContent = await file.text();

            // Import data
            const importResult = await importAllDataFromJSON(fileContent);

            setLoading(false);

            if (importResult.success) {
              GlobalAlert.show({
                title: "Import Successful",
                message: `Successfully imported ${importResult.projectsImported} projects!`,
                primaryText: "Okay",
                onPrimaryPress: () => {
                  loadData(); // Reload data
                },
              });
            } else {
              throw new Error("Import failed");
            }
          } catch (error) {
            setLoading(false);
            console.error("Import error:", error);
            GlobalAlert.show({
              title: "Import Failed",
              message:
                "Failed to import data. Please make sure the file is a valid QuillKalam backup.",
              primaryText: "Okay",
            });
          }
        },
      });
    } catch (error) {
      console.error("File picker error:", error);
      GlobalAlert.show({
        title: "Error",
        message: "Failed to select file. Please try again.",
        primaryText: "Okay",
      });
    }
  };

  const getProjectTypeCount = (type: string) => {
    return projects.filter((p) => p.type === type).length;
  };

  const getStatusCount = (status: string) => {
    return projects.filter((p) => p.status === status).length;
  };

  const getAverageWordCount = () => {
    if (projects.length === 0) return 0;
    const total = projects.reduce((sum, p) => sum + (p.word_count || 0), 0);
    return Math.round(total / projects.length);
  };

  const getLongestProject = () => {
    if (projects.length === 0) return null;
    return projects.reduce((max, p) =>
      (p.word_count || 0) > (max.word_count || 0) ? p : max
    );
  };

  const getPublishedProjects = () => {
    return projects.filter((p) => p.is_published === 1);
  };

  const handleLogout = async () => {
    GlobalAlert.show({
      title: "Logout",
      message: "Are you sure you want to logout?",
      primaryText: "Cancel",
      secondaryText: "Logout",
      onSecondary: async () => {
        try {
          // Clear API authentication
          await clearAuth();

          // Clear active session from database
          clearActiveSession();

          // Clear user state
          setUser(null);
          setStats(null);
          setProjects([]);

          // Navigate to home
          router.replace("/");

          GlobalAlert.show({
            title: "Success",
            message: "You have been logged out successfully",
            primaryText: "Okay",
          });
        } catch (error) {
          GlobalAlert.show({
            title: "Error",
            message: "Failed to logout properly",
            primaryText: "Okay",
          });
        }
      },
    });
  };

  // ...existing code...
  // ...existing code...

  const longestProject = getLongestProject();
  const publishedCount = getPublishedProjects().length;

  if (loading) {
    <Background>
      <View className="absolute inset-0 justify-center items-center bg-white text-black dark:bg-black dark:text-white">
        <ActivityIndicator />
        <Text className="text-black dark:text-white text-4xl">Loading...</Text>
      </View>
    </Background>;
  }

  return (
    <Background>
      <KeyboardAvoidingLayout>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-16 pb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-gray-900 dark:text-light-100 mb-1">
                Profile
              </Text>
            </View>
            {user && (
              <TouchableOpacity
                onPress={handleLogout}
                className="px-4 py-2 bg-red-100 dark:bg-red-400 rounded-full"
              >
                <Text className=" dark:text-white font-semibold text-sm">
                  Logout
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Info Card */}
          <View className="px-6 mb-6">
            <View className="bg-white dark:bg-transparent rounded-3xl p-4  shadow-lg">
              <View className="items-center mb-4">
                {user && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <View className="w-24 h-24 rounded-full bg-light-100 dark:bg-dark-100 justify-center items-center mb-4">
                        <ActivityIndicator size="large" color="#6B46C1" />
                      </View>
                    ) : user?.profile_image_url ? (
                      <Image
                        source={{ uri: user.profile_image_url }}
                        className="w-24 h-24 rounded-full mb-4"
                      />
                    ) : (
                      <View className="w-24 h-24 rounded-full bg-primary justify-center items-center mb-4">
                        <Text className="text-3xl text-white font-bold">
                          {user?.displayName
                            ? user.displayName[0].toUpperCase()
                            : "U"}
                        </Text>
                      </View>
                    )}
                    <View className="absolute bottom-3 right-0 w-8 h-8 bg-secondary rounded-full items-center justify-center border-2 border-white dark:border-dark-200">
                      <Text className="text-sm">📷</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {isEditingProfile ? (
                  <View className="w-full gap-3 mt-2">
                    <TextInput
                      value={editForm.displayName}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, displayName: text })
                      }
                      placeholder="Display Name"
                      placeholderTextColor="#9CA3AF"
                      className="bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-light-100"
                    />
                    <TextInput
                      value={editForm.email}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, email: text })
                      }
                      placeholder="Email (optional)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl text-center text-base text-gray-900 dark:text-light-100"
                    />
                    <TextInput
                      value={editForm.bio}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, bio: text })
                      }
                      placeholder="Tell us about yourself..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      className="bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl text-base text-gray-900 dark:text-light-100 min-h-[80px]"
                    />
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setIsEditingProfile(false)}
                        className="flex-1 bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl"
                      >
                        <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleUpdateProfile}
                        className="flex-1 bg-primary px-4 py-3 rounded-xl"
                      >
                        <Text className="text-white font-bold text-center">
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  user && (
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={() => setIsEditingProfile(true)}
                        className="flex-row items-center gap-2"
                      >
                        <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                          {user?.display_name || "Guest Writer"}
                        </Text>
                        <Text className="text-gray-400 dark:text-light-200">
                          ✏️
                        </Text>
                      </TouchableOpacity>
                      {user?.email && (
                        <Text className="text-sm text-gray-600 dark:text-light-200 mt-1">
                          {user.email}
                        </Text>
                      )}
                      {user?.phone_number && (
                        <Text className="text-xs text-gray-500 dark:text-light-200 mt-1">
                          📱 {user.phone_number}
                        </Text>
                      )}
                      {user?.bio ? (
                        <Text className="text-sm text-gray-600 dark:text-light-200 text-center mt-2 px-4">
                          {user.bio}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setIsEditingProfile(true)}
                        >
                          <Text className="text-sm text-primary text-center mt-2">
                            + Add a bio
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                )}
              </View>

              {/* Daily Goal */}
              <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 ">
                <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                  Daily Writing Goal
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                    {dailyGoal.toLocaleString()} words
                  </Text>
                  <TouchableOpacity
                    onPress={handleEditDailyGoal}
                    className="bg-primary px-4 py-2 rounded-full"
                  >
                    <Text className="text-white text-xs font-bold">
                      Edit Goal
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-500 dark:text-light-200 mt-2">
                  Stay motivated with a daily writing target
                </Text>
              </View>
            </View>
          </View>

          {/* Publishing Status */}
          {publishedCount > 0 && (
            <View className="px-6 mb-6">
              <TouchableOpacity className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-6 shadow-lg">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-white/80 mb-1">
                      Published Works
                    </Text>
                    <Text className="text-3xl font-bold text-white mb-1">
                      {publishedCount}
                    </Text>
                    <Text className="text-xs text-white/70">
                      Tap to view your published projects
                    </Text>
                  </View>
                  <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                    <Text className="text-4xl">📚</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Statistics Overview */}
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
              Writing Statistics
            </Text>
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
              <View className="flex-row flex-wrap gap-3">
                <View className="bg-primary/10 rounded-2xl p-4 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                    Total Projects
                  </Text>
                  <Text className="text-3xl font-bold text-primary">
                    {stats?.totalProjects || 0}
                  </Text>
                </View>
                <View className="bg-secondary/30 rounded-2xl p-4 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                    Total Words
                  </Text>
                  <Text className="text-3xl font-bold text-gray-900 dark:text-light-100">
                    {(stats?.totalWords || 0).toLocaleString()}
                  </Text>
                </View>
                <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                    Avg per Project
                  </Text>
                  <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                    {getAverageWordCount().toLocaleString()}
                  </Text>
                </View>
                <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                    Completed
                  </Text>
                  <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {getStatusCount("complete")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Project Breakdown */}
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
              Project Breakdown
            </Text>
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
              <View className="gap-3">
                {[
                  { type: "novel", label: "Novels", icon: "📖" },
                  { type: "poetry", label: "Poetry", icon: "✍️" },
                  { type: "shortStory", label: "Short Stories", icon: "📄" },
                  { type: "manuscript", label: "Manuscripts", icon: "📝" },
                ].map((item) => (
                  <View
                    key={item.type}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">{item.icon}</Text>
                      <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                        {item.label}
                      </Text>
                    </View>
                    <Text className="text-xl font-bold text-primary">
                      {getProjectTypeCount(item.type)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Achievements */}
          {longestProject && (
            <View className="px-6 mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
                Achievements
              </Text>
              <View className="bg-amber-200 dark:bg-gray-600 rounded-3xl p-6 dark:shadow-lg">
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-4xl">🏆</Text>
                  <View className="flex-1">
                    <Text className="text-sm text-black dark:text-white/80 mb-1">
                      Longest Project
                    </Text>
                    <Text className="text-xl font-bold dark:text-white">
                      {longestProject.title}
                    </Text>
                  </View>
                </View>
                <Text className="text-3xl font-bold dark:text-white">
                  {(longestProject.word_count || 0).toLocaleString()} words
                </Text>
              </View>
            </View>
          )}

          {/* Status Summary */}
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
              Project Status
            </Text>
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
              <View className="gap-3">
                {[
                  {
                    status: "draft",
                    label: "📝 Draft",
                    color: "text-gray-900",
                  },
                  {
                    status: "in_progress",
                    label: "⚡ In Progress",
                    color: "text-blue-600",
                  },
                  {
                    status: "revision",
                    label: "🔄 Revision",
                    color: "text-yellow-600",
                  },
                  {
                    status: "complete",
                    label: "✅ Complete",
                    color: "text-green-600",
                  },
                  {
                    status: "published",
                    label: "📚 Published",
                    color: "text-primary",
                  },
                ].map((item) => (
                  <View
                    key={item.status}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-gray-700 dark:text-light-100">
                      {item.label}
                    </Text>
                    <Text
                      className={`font-bold ${item.color} dark:text-light-100`}
                    >
                      {getStatusCount(item.status)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="px-6 mb-11">
            <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
              Actions
            </Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleExportData}
                className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-green-500/10 justify-center items-center">
                    <Text className="text-xl">📤</Text>
                  </View>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Export All Data
                  </Text>
                </View>
                <Text className="text-gray-400 dark:text-light-200">›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImportData}
                className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-blue-500/10 justify-center items-center">
                    <Text className="text-xl">📥</Text>
                  </View>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Import All Data
                  </Text>
                </View>
                <Text className="text-gray-400 dark:text-light-200">›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  GlobalAlert.show({
                    title: "About QuillKalam",
                    message:
                      "QuillKalam - Your Complete Writing Companion\n\nVersion 1.0.0\n\nCreate, organize, and publish your literary works with ease.",
                    primaryText: "Okay",
                  })
                }
                className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-100 justify-center items-center">
                    <Text className="text-xl">ℹ️</Text>
                  </View>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    About QuillKalam
                  </Text>
                </View>
                <Text className="text-gray-400 dark:text-light-200">›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Prompt for Guest Users */}
          {!user && (
            <View className="px-6 mb-11">
              <View className="bg-primary/10 rounded-3xl p-6 border-2 border-primary/20">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-2">
                  Sign in to save your profile
                </Text>
                <Text className="text-sm text-gray-600 dark:text-light-200 mb-4">
                  Create an account to sync your profile, settings, and
                  published works across devices.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  className="bg-primary py-3 rounded-xl"
                >
                  <Text className="text-white font-bold text-center">
                    Sign In / Register
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showGoalEditor && (
            <View className="absolute top-0 left-0 max-h-screen inset-0 bg-black/50 justify-center items-center z-50">
              <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 mx-4 w-80">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
                  Set Daily Writing Goal
                </Text>
                <Text className="text-gray-600 dark:text-light-200 mb-4">
                  Enter your daily word count goal:
                </Text>

                <TextInput
                  value={tempGoal}
                  onChangeText={setTempGoal}
                  placeholder="Enter word count goal"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl text-gray-900 dark:text-light-100 mb-4 border border-gray-300 dark:border-dark-100"
                  autoFocus
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleCancelDailyGoal}
                    className="flex-1 bg-light-100 dark:bg-dark-100 px-4 py-3 rounded-xl"
                  >
                    <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveDailyGoal}
                    className="flex-1 bg-primary px-4 py-3 rounded-xl"
                  >
                    <Text className="text-white font-bold text-center">
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingLayout>
    </Background>
  );
};

export default Profile;
