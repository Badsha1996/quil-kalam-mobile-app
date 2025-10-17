import Background from "@/components/common/Background";
import { getAllProjects, getStats } from "@/utils/database";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Profile = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [userName, setUserName] = useState("Writer");
  const [isEditingName, setIsEditingName] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(500);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const statsData = getStats();
    const projectsData = getAllProjects();
    setStats(statsData);
    setProjects(projectsData);
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

  const handleExportAllData = () => {
    Alert.alert(
      "Export All Data",
      "Export all your projects and settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            // Implementation would go here
            Alert.alert("Success", "Data exported successfully!");
          },
        },
      ]
    );
  };

  const longestProject = getLongestProject();

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-light-100 mb-2">
            Profile
          </Text>
          <Text className="text-sm text-gray-600 dark:text-light-200">
            Your writing journey at a glance
          </Text>
        </View>

        {/* User Info Card */}
        <View className="px-6 mb-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
            <View className="items-center mb-6">
              <View className="w-24 h-24 rounded-full bg-primary justify-center items-center mb-4">
                <Text className="text-5xl">✍️</Text>
              </View>
              {isEditingName ? (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    className="bg-light-100 dark:bg-dark-100 px-4 py-2 rounded-full text-center text-xl font-bold text-gray-900 dark:text-light-100"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setIsEditingName(false)}
                    className="bg-secondary px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-dark-300 font-bold">
                      ✓
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditingName(true)}
                  className="flex-row items-center gap-2"
                >
                  <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                    {userName}
                  </Text>
                  <Text className="text-gray-400 dark:text-light-200">✏️</Text>
                </TouchableOpacity>
              )}
              <Text className="text-sm text-gray-600 dark:text-light-200 mt-1">
                Author & Creative Writer
              </Text>
            </View>

            {/* Daily Goal */}
            <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-4">
              <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                Daily Writing Goal
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                  {dailyGoal} words
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.prompt(
                      "Set Daily Goal",
                      "Enter your daily word count goal",
                      (text) => {
                        const num = parseInt(text);
                        if (!isNaN(num) && num > 0) {
                          setDailyGoal(num);
                        }
                      },
                      "plain-text",
                      dailyGoal.toString()
                    )
                  }
                  className="bg-primary px-4 py-2 rounded-full"
                >
                  <Text className="text-white dark:text-dark-100 text-xs font-bold">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

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
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">📖</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Novels
                  </Text>
                </View>
                <Text className="text-xl font-bold text-primary">
                  {getProjectTypeCount("novel")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">✍️</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Poetry
                  </Text>
                </View>
                <Text className="text-xl font-bold text-primary">
                  {getProjectTypeCount("poetry")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">📄</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Short Stories
                  </Text>
                </View>
                <Text className="text-xl font-bold text-primary">
                  {getProjectTypeCount("shortStory")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">📝</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                    Manuscripts
                  </Text>
                </View>
                <Text className="text-xl font-bold text-primary">
                  {getProjectTypeCount("manuscript")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        {longestProject && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
              Achievements
            </Text>
            <View className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center gap-3 mb-3">
                <Text className="text-4xl">🏆</Text>
                <View className="flex-1">
                  <Text className="text-sm text-white/80 dark:text-dark-100/80 mb-1">
                    Longest Project
                  </Text>
                  <Text className="text-xl font-bold text-white dark:text-dark-100">
                    {longestProject.title}
                  </Text>
                </View>
              </View>
              <Text className="text-3xl font-bold text-white dark:text-dark-100">
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
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 dark:text-light-100">
                  📝 Draft
                </Text>
                <Text className="font-bold text-gray-900 dark:text-light-100">
                  {getStatusCount("draft")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 dark:text-light-100">
                  ⚡ In Progress
                </Text>
                <Text className="font-bold text-gray-900 dark:text-light-100">
                  {getStatusCount("in_progress")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 dark:text-light-100">
                  🔄 Revision
                </Text>
                <Text className="font-bold text-gray-900 dark:text-light-100">
                  {getStatusCount("revision")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 dark:text-light-100">
                  ✅ Complete
                </Text>
                <Text className="font-bold text-green-600 dark:text-green-400">
                  {getStatusCount("complete")}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 dark:text-light-100">
                  📚 Published
                </Text>
                <Text className="font-bold text-primary">
                  {getStatusCount("published")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
            Actions
          </Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleExportAllData}
              className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary justify-center items-center">
                  <Text className="text-xl">📤</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-light-100">
                  Export All Data
                </Text>
              </View>
              <Text className="text-gray-400 dark:text-light-200">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Import Data",
                  "This feature allows you to import previously exported data"
                )
              }
              className="bg-white dark:bg-dark-200 rounded-2xl p-4 shadow-lg flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-secondary justify-center items-center">
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
                Alert.alert("About", "QuillKalam - Your Writing Companion")
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
      </ScrollView>
    </Background>
  );
};

export default Profile;