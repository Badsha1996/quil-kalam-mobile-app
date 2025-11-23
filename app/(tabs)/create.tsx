import Background from "@/components/common/Background";
import { genres, projectTypes, templates } from "@/constants/create";
import { createProject } from "@/utils/database";
// @ts-ignore
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const create = () => {
  const router = useRouter();
  const [projectType, setProjectType] = useState<
    "novel" | "poetry" | "shortStory" | "manuscript" | null
  >(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [targetWordCount, setTargetWordCount] = useState("");
  const [writingTemplate, setWritingTemplate] = useState<string>("freeform");

  // ********************************** Animation States and Function calls **********************************
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ********************************** Function Definations **********************************

  const handleCreateProject = async () => {
    if (!projectType) {
      Alert.alert("Select Type", "Please choose a project type");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your project");
      return;
    }

    //@ts-ignore
    let projectId;

    try {
      projectId = createProject({
        type: projectType,
        title: title.trim(),
        description: description.trim(),
        genre: genre || undefined,
        authorName: authorName.trim() || undefined,
        writingTemplate: writingTemplate as any,
        targetWordCount: targetWordCount
          ? parseInt(targetWordCount)
          : undefined,
      });

      // Project created successfully - now handle navigation
      if (projectId) {
        // Define route mapping
        type AllowedRoute = "/novel/[id]" | "/poetry/[id]";
        const routeMap: Record<
          "novel" | "poetry" | "shortStory" | "manuscript",
          AllowedRoute
        > = {
          novel: "/novel/[id]",
          poetry: "/poetry/[id]",
          shortStory: "/novel/[id]",
          manuscript: "/novel/[id]",
        };

        const pathname =
          routeMap[
            projectType as "novel" | "poetry" | "shortStory" | "manuscript"
          ] ?? "/novel/[id]";

        // Show success alert AFTER confirming project creation
        Alert.alert(
          "Success",
          "Project created successfully!",
          [
            {
              text: "Create Another",
              onPress: () => {
                resetForm();
              },
              style: "cancel",
            },
            {
              text: "View Project",
              onPress: () => router.push("/search"),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create project. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      resetForm();
    }
  };

  const resetForm = () => {
    setProjectType(null);
    setTitle("");
    setDescription("");
    setGenre("");
    setAuthorName("");
    setTargetWordCount("");
    setWritingTemplate("freeform");
  };

  return (
    <Background>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/*  ********************************** Header ***********************************/}
          <View className="px-6 pt-16 pb-10">
            <Animated.View
              className="items-center"
              style={{
                opacity: heroFade,
                transform: [{ translateY: heroSlide }, { scale: heroScale }],
              }}
            >
              <View className="w-20 h-20 rounded-3xl bg-primary justify-center items-center mb-6">
                <Text className="text-5xl">✨</Text>
              </View>

              <Text className="text-4xl font-bold text-dark-200 dark:text-light-100 mb-3 text-center">
                Create Your Masterpiece
              </Text>

              <Text className="text-base text-dark-100 dark:text-light-200 mb-8 text-center leading-6 px-4">
                Choose your format and start writing with powerful tools
              </Text>
            </Animated.View>
          </View>

          {/*  ********************************** Project Types ***********************************/}
          <View className="px-6 mb-6">
            <Text className="text-2xl font-bold text-dark-200 dark:text-light-200 mb-4">
              What are you creating?
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {projectTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => {
                    if (projectType !== type.value) {
                      resetForm();
                      setProjectType(type.value as any);
                    }
                  }}
                  className={`bg-light-100 dark:bg-dark-200 rounded-3xl p-5 shadow-lg active:opacity-80 ${
                    projectType === type.value ? "border-4 border-primary" : ""
                  }`}
                  style={{
                    width: "48%",
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                  }}
                >
                  <View className="w-12 h-12 rounded-xl bg-primary justify-center items-center mb-3">
                    <Text className="text-3xl">{type.icon}</Text>
                  </View>
                  <Text className="text-lg font-bold text-dark-300 dark:text-light-100  mb-1">
                    {type.label}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-light-200">
                    {type.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/*  ********************************** Project Form ***********************************/}
          <View className="px-6">
            <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-xl">
              <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-3">
                Project Title <Text className="text-primary">*</Text>
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter your project title..."
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-100 text-dark-300  dark:text-light-200 rounded-2xl px-4 py-4  text-base"
              />
            </View>

            <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-3">
                Author Name
              </Text>
              <TextInput
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="Your name (optional)"
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-100 text-dark-300  dark:text-light-200 rounded-2xl px-4 py-4  text-base"
              />
            </View>

            <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-3">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What's your story about? (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-light-100 dark:bg-dark-100 text-dark-300  dark:text-light-200 rounded-2xl px-4 py-4  text-base"
                style={{ minHeight: 100 }}
              />
            </View>

            <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-4">
                Choose a Genre
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {genres.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGenre(g)}
                    className={`px-5 py-3 rounded-full active:opacity-80 ${
                      genre === g ? "bg-primary " : "bg-light-100"
                    }`}
                  >
                    <Text
                      className={`${
                        genre === g
                          ? "text-white font-bold"
                          : "text-gray-600 font-semibold"
                      } text-sm`}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {projectType === "novel" && (
              <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-lg">
                <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-4">
                  Writing Structure
                </Text>
                <View className="gap-3">
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.value}
                      onPress={() => setWritingTemplate(template.value)}
                      className={`p-4 rounded-2xl border-2 ${
                        writingTemplate === template.value
                          ? "border-primary bg-primary/10"
                          : "border-light-100 bg-light-100 dark:bg-dark-200"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-dark-300 dark:text-light-200 mb-1">
                            {template.label}
                          </Text>
                          <Text className="text-sm text-gray-600 dark:text-light-200">
                            {template.desc}
                          </Text>
                        </View>
                        {writingTemplate === template.value && (
                          <View className="w-6 h-6 rounded-full bg-primary justify-center items-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="bg-light-200 dark:bg-dark-200 rounded-3xl p-6 mb-6 shadow-lg">
              <Text className="text-lg font-bold text-dark-300 dark:text-light-200 mb-3">
                Target Word Count
              </Text>
              <TextInput
                value={targetWordCount}
                onChangeText={setTargetWordCount}
                placeholder="e.g., 50000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="bg-light-100 dark:bg-dark-100 text-dark-300  dark:text-light-200 rounded-2xl px-4 py-4  text-base"
              />
              <Text className="text-xs text-gray-500 dark:text-light-200 mt-2">
                Set a goal to track your progress
              </Text>
            </View>
          </View>

          {/*  ********************************** BUTTONS ***********************************/}
          <View className="px-6 mb-8">
            <TouchableOpacity
              onPress={handleCreateProject}
              className="bg-secondary px-8 py-5 rounded-full active:opacity-80 mb-4"
              style={{
                shadowColor: "#FFC2C7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text className="text-dark-300 font-bold text-lg text-center">
                Create Project
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => resetForm()}
              className="bg-gray-200 px-8 py-5 rounded-full active:opacity-80 mb-4"
              style={{
                shadowColor: "#FFC2C7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text className="text-gray-600   text-base text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
};

export default create;
