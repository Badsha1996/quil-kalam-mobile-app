import Background from "@/components/common/Background";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { createProject } from "@/utils/database";

const create = () => {
  const router = useRouter();
  const [projectType, setProjectType] = useState<"novel" | "poetry" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");

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

  const handleCreateProject = () => {
    if (!projectType) {
      Alert.alert("Select Type", "Please choose Novel or Poetry");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your project");
      return;
    }

    try {
      // Save to database
      const projectId = createProject(projectType, title, description, genre);
      console.log("Project created with ID:", projectId);

      Alert.alert("Success", "Project created successfully!", [
        {
          text: "View Library",
          onPress: () => {
            router.push("/search");
          },
        },
        {
          text: "Create Another",
          onPress: () => {
            setProjectType(null);
            setTitle("");
            setDescription("");
            setGenre("");
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating project:", error);
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  };

  const genres = [
    "Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Horror",
    "Thriller",
    "Literary",
    "Other",
  ];

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
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

            <Text className="text-4xl font-bold text-gray-900 mb-3 text-center">
              Start Creating
            </Text>

            <Text className="text-base text-gray-600 mb-8 text-center leading-6 px-4">
              Begin your literary journey with a new project
            </Text>
          </Animated.View>
        </View>

        {/* Project Type Selection */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            What are you writing?
          </Text>
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => setProjectType("novel")}
              className={`flex-1 bg-white rounded-3xl p-6 shadow-lg active:opacity-80 ${
                projectType === "novel" ? "border-4 border-primary" : ""
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mb-3">
                <Text className="text-3xl">📖</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">
                Novel
              </Text>
              <Text className="text-sm text-gray-600">
                Long-form stories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setProjectType("poetry")}
              className={`flex-1 bg-white rounded-3xl p-6 shadow-lg active:opacity-80 ${
                projectType === "poetry" ? "border-4 border-primary" : ""
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mb-3">
                <Text className="text-3xl">✍️</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">
                Poetry
              </Text>
              <Text className="text-sm text-gray-600">
                Verses & poems
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View className="px-6">
          {/* Title Input */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Project Title <Text className="text-primary">*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your project title..."
              placeholderTextColor="#9CA3AF"
              className="bg-light-100 rounded-2xl px-4 py-4 text-gray-900 text-base"
            />
          </View>

          {/* Description Input */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-3">
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
              className="bg-light-100 rounded-2xl px-4 py-4 text-gray-900 text-base"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Genre Selection */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Choose a Genre
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {genres.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGenre(g)}
                  className={`px-5 py-3 rounded-full active:opacity-80 ${
                    genre === g
                      ? "bg-primary"
                      : "bg-light-100"
                  }`}
                >
                  <Text
                    className={`${
                      genre === g ? "text-white font-bold" : "text-gray-600 font-semibold"
                    } text-sm`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6">
          <TouchableOpacity
            onPress={handleCreateProject}
            className="bg-secondary px-8 py-4 rounded-full active:opacity-80 mb-4"
            style={{
              shadowColor: "#FFC2C7",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text className="text-gray-900 font-bold text-base text-center">
              Create Project
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setProjectType(null);
              setTitle("");
              setDescription("");
              setGenre("");
            }}
            className="py-3 active:opacity-60"
          >
            <Text className="text-gray-600 text-base text-center font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Background>
  );
};

export default create;