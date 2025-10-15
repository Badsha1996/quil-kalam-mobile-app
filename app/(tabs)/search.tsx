import Background from "@/components/common/Background";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import {
  getAllProjects,
  searchProjects,
  getProjectsByType,
  deleteProject,
  initDB,
} from "@/utils/database";

type Project = {
  id: number;
  type: "novel" | "poetry";
  title: string;
  description: string;
  genre: string;
  word_count: number;
  created_at: number;
  updated_at: number;
};

const search = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "novel" | "poetry">("all");

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Initialize database
    initDB();
    loadProjects();

    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Reload projects when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = () => {
    const allProjects = getAllProjects() as Project[];
    setProjects(allProjects);
    setFilteredProjects(allProjects);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      applyFilter(filterType);
    } else {
      const results = searchProjects(query);
      if (filterType !== "all") {
        setFilteredProjects((results as Project[]).filter((p: Project) => p.type === filterType));
      } else {
        setFilteredProjects(results as Project[]);
      }
    }
  };

  const applyFilter = (type: "all" | "novel" | "poetry") => {
    setFilterType(type);
    if (type === "all") {
      if (searchQuery.trim() === "") {
        setFilteredProjects(projects);
      } else {
        setFilteredProjects(searchProjects(searchQuery) as Project[]);
      }
    } else {
      const filtered = searchQuery.trim() === "" 
        ? getProjectsByType(type)
        : (searchProjects(searchQuery) as Project[]).filter((p: Project) => p.type === type);
      setFilteredProjects(filtered as Project[]);
    }
  };

  const handleDeleteProject = (id: number, title: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProject(id);
            loadProjects();
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={{
          opacity: cardFade,
          transform: [{ translateY: cardSlide }],
        }}
      >
        <TouchableOpacity
          onPress={() => router.push(`/books/${project.id}`)}
          onLongPress={() => handleDeleteProject(project.id, project.title)}
          className="bg-white rounded-3xl p-5 mb-4 shadow-lg active:opacity-80"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="flex-row items-start mb-3">
            <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mr-4">
              <Text className="text-2xl">{project.type === "novel" ? "📖" : "✍️"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
                {project.title}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="bg-primary px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {project.type.toUpperCase()}
                  </Text>
                </View>
                {project.genre && (
                  <View className="bg-light-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs font-semibold">
                      {project.genre}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {project.description && (
            <Text className="text-sm text-gray-600 mb-3 leading-5" numberOfLines={2}>
              {project.description}
            </Text>
          )}

          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500">
              {project.word_count > 0 ? `${project.word_count} words` : "Empty"}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(project.updated_at)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Animated.View
            style={{
              opacity: heroFade,
              transform: [{ translateY: heroSlide }],
            }}
          >
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              My Library
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              {projects.length} {projects.length === 1 ? "project" : "projects"} in your collection
            </Text>

            {/* Search Bar */}
            <View className="bg-white rounded-2xl px-4 py-2 shadow-lg mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search your projects..."
                placeholderTextColor="#9CA3AF"
                className="text-gray-900 text-base py-2"
              />
            </View>

            {/* Filter Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => applyFilter("all")}
                className={`px-5 py-3 rounded-full ${
                  filterType === "all" ? "bg-primary" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    filterType === "all" ? "text-white" : "text-gray-600"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => applyFilter("novel")}
                className={`px-5 py-3 rounded-full ${
                  filterType === "novel" ? "bg-primary" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    filterType === "novel" ? "text-white" : "text-gray-600"
                  }`}
                >
                  📖 Novels
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => applyFilter("poetry")}
                className={`px-5 py-3 rounded-full ${
                  filterType === "poetry" ? "bg-primary" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    filterType === "poetry" ? "text-white" : "text-gray-600"
                  }`}
                >
                  ✍️ Poetry
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Projects List */}
        <View className="px-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <View className="items-center py-16">
              <Text className="text-6xl mb-4">📚</Text>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? "No results found" : "No projects yet"}
              </Text>
              <Text className="text-sm text-gray-600 text-center px-8">
                {searchQuery
                  ? "Try a different search term"
                  : "Start creating your first masterpiece!"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Background>
  );
};

export default search;