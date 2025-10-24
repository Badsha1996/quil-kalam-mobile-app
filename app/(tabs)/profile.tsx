import Background from "@/components/common/Background";
import {
  getAllProjects,
  getCurrentUser,
  getSetting,
  getStats,
  setSetting,
  updateUserProfile,
  updateDailyGoal,
} from "@/utils/database";
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

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = () => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      const statsData = getStats();
      const projectsData = getAllProjects();
      setStats(statsData);
      setProjects(projectsData as any[]);

      if (currentUser) {
        setEditForm({
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          bio: currentUser.bio || "",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
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

  const handleUpdateProfile = () => {
    if (!user) return;

    try {
      updateUserProfile(user.id, {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim(),
        bio: editForm.bio.trim(),
      });
      setIsEditingProfile(false);
      loadData(); // Reload to get updated user data
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to update your profile picture"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && user && result.assets[0].uri) {
        setIsUploadingImage(true);

        // Update profile with new image URI
        updateUserProfile(user.id, {
          profileImageUri: result.assets[0].uri,
        });

        // Reload user data to show updated image
        setTimeout(() => {
          loadData();
          setIsUploadingImage(false);
          Alert.alert("Success", "Profile picture updated!");
        }, 500);
      }
    } catch (error) {
      setIsUploadingImage(false);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const handleUpdateDailyGoal = (newGoal: number) => {
    if (newGoal < 1) {
      Alert.alert("Error", "Daily goal must be at least 1 word");
      return;
    }

    if (newGoal > 100000) {
      Alert.alert("Error", "Daily goal cannot exceed 100,000 words");
      return;
    }

    try {
      updateDailyGoal(newGoal);
      setDailyGoal(newGoal);
      Alert.alert(
        "Success",
        `Daily goal set to ${newGoal.toLocaleString()} words!`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update daily goal");
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
        Alert.alert(
          "Error",
          "Please enter a valid number between 1 and 100,000"
        );
      }
    } else {
      Alert.alert("Error", "Please enter a valid number");
    }
  };

  const handleCancelDailyGoal = () => {
    setShowGoalEditor(false);
    setTempGoal("");
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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Clear user state
          setUser(null);
          setStats(null);
          setProjects([]);

          // Navigate to home
          router.replace("/");
        },
      },
    ]);
  };

  const longestProject = getLongestProject();
  const publishedCount = getPublishedProjects().length;

  return (
    <Background>
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
            <Text className="text-sm text-gray-600 dark:text-light-200">
              Your writing journey
            </Text>
          </View>
          {user && (
            <TouchableOpacity
              onPress={handleLogout}
              className="px-4 py-2 bg-red-500/10 rounded-full"
            >
              <Text className="text-red-600 dark:text-red-400 font-semibold text-sm">
                Logout
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Info Card */}
        <View className="px-6 mb-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
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
                  ) : user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
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
                        {user?.displayName || "Guest Writer"}
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
                    {user?.phoneNumber && (
                      <Text className="text-xs text-gray-500 dark:text-light-200 mt-1">
                        📱 {user.phoneNumber}
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
            <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mt-4">
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
            <View className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center gap-3 mb-3">
                <Text className="text-4xl">🏆</Text>
                <View className="flex-1">
                  <Text className="text-sm text-white/80 mb-1">
                    Longest Project
                  </Text>
                  <Text className="text-xl font-bold text-white">
                    {longestProject.title}
                  </Text>
                </View>
              </View>
              <Text className="text-3xl font-bold text-white">
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
                { status: "draft", label: "📝 Draft", color: "text-gray-900" },
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
            <TouchableOpacity className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary/10 justify-center items-center">
                  <Text className="text-xl">⚙️</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                  Settings
                </Text>
              </View>
              <Text className="text-gray-400 dark:text-light-200">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between">
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

            <TouchableOpacity className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-blue-500/10 justify-center items-center">
                  <Text className="text-xl">📥</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                  Import Data
                </Text>
              </View>
              <Text className="text-gray-400 dark:text-light-200">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "About QuillKalam",
                  "QuillKalam - Your Complete Writing Companion\n\nVersion 3.0\n\nCreate, organize, and publish your literary works with ease.",
                  [{ text: "OK" }]
                )
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
                Create a local account
              </Text>
              <Text className="text-sm text-gray-600 dark:text-light-200 mb-4">
                Create a local account to save your profile and settings.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="bg-primary py-3 rounded-xl"
              >
                <Text className="text-white font-bold text-center">
                  Create Account
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
                  <Text className="text-white font-bold text-center">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </Background>
  );
};

export default Profile;
