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
  Modal,
} from "react-native";
import {
  getAllProjects,
  searchProjects,
  getProjectsByType,
  getProjectsByGenre,
  deleteProject,
  getProjectStats,
  initDB,
} from "@/utils/database";

type Project = {
  id: number;
  type: "novel" | "poetry" | "shortStory" | "manuscript";
  title: string;
  description: string;
  genre: string;
  author_name: string;
  word_count: number;
  target_word_count: number;
  status: string;
  writing_template: string;
  created_at: number;
  updated_at: number;
};

const search = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "novel" | "poetry" | "shortStory" | "manuscript">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title" | "wordcount">("updated");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
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

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = () => {
    const allProjects = getAllProjects() as Project[];
    setProjects(allProjects);
    applySorting(allProjects);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      applyFilter(filterType);
    } else {
      const results = searchProjects(query);
      const filtered = filterResults(results as Project[]);
      applySorting(filtered);
    }
  };

  const filterResults = (results: Project[]) => {
    let filtered = results;
    
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }
    
    if (selectedGenre) {
      filtered = filtered.filter((p) => p.genre === selectedGenre);
    }
    
    return filtered;
  };

  const applyFilter = (type: "all" | "novel" | "poetry" | "shortStory" | "manuscript") => {
    setFilterType(type);
    let filtered: Project[];
    
    if (type === "all") {
      filtered = searchQuery.trim() === "" ? projects : (searchProjects(searchQuery) as Project[]);
    } else {
      filtered = searchQuery.trim() === "" 
        ? (getProjectsByType(type) as Project[])
        : (searchProjects(searchQuery) as Project[]).filter((p) => p.type === type);
    }
    
    if (selectedGenre) {
      filtered = filtered.filter((p) => p.genre === selectedGenre);
    }
    
    applySorting(filtered);
  };

  const applySorting = (projectsToSort: Project[]) => {
    const sorted = [...projectsToSort].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "wordcount":
          return b.word_count - a.word_count;
        case "created":
          return b.created_at - a.created_at;
        case "updated":
        default:
          return b.updated_at - a.updated_at;
      }
    });
    setFilteredProjects(sorted);
  };

  const handleDeleteProject = (id: number, title: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
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

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "in_progress": return "bg-blue-500";
      case "revision": return "bg-yellow-500";
      case "complete": return "bg-green-500";
      case "published": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "novel": return "📖";
      case "poetry": return "✍️";
      case "shortStory": return "📝";
      case "manuscript": return "📄";
      default: return "📚";
    }
  };

  const uniqueGenres = Array.from(new Set(projects.map(p => p.genre).filter(Boolean)));

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

    const progress = project.target_word_count 
      ? (project.word_count / project.target_word_count) * 100 
      : 0;

    return (
      <Animated.View
        style={{
          opacity: cardFade,
          transform: [{ translateY: cardSlide }],
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/novel/[id]", params: { id: String(project.id) } })
          }
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
            <View className="w-14 h-14 rounded-2xl bg-secondary justify-center items-center mr-4">
              <Text className="text-3xl">{getTypeIcon(project.type)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1" numberOfLines={1}>
                {project.title}
              </Text>
              {project.author_name && (
                <Text className="text-sm text-gray-500 mb-2">
                  by {project.author_name}
                </Text>
              )}
              <View className="flex-row items-center gap-2 flex-wrap">
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
                <View className={`${getStatusColor(project.status)} px-3 py-1 rounded-full`}>
                  <Text className="text-white text-xs font-bold">
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {project.description && (
            <Text className="text-sm text-gray-600 mb-3 leading-5" numberOfLines={2}>
              {project.description}
            </Text>
          )}

          {/* Progress Bar */}
          {project.target_word_count > 0 && (
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">
                  Progress: {progress.toFixed(0)}%
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatWordCount(project.word_count)} / {formatWordCount(project.target_word_count)}
                </Text>
              </View>
              <View className="h-2 bg-light-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </View>
            </View>
          )}

          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-4">
              <Text className="text-xs text-gray-500">
                📊 {formatWordCount(project.word_count)} words
              </Text>
              {project.writing_template && project.writing_template !== 'freeform' && (
                <Text className="text-xs text-gray-500">
                  📋 {project.writing_template.replace('_', ' ')}
                </Text>
              )}
            </View>
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
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-4xl font-bold text-gray-900 mb-2">
                  My Library
                </Text>
                <Text className="text-base text-gray-600">
                  {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
                  {searchQuery && " found"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="w-12 h-12 rounded-full bg-white justify-center items-center shadow-lg"
              >
                <Text className="text-2xl">⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="bg-white rounded-2xl px-4 py-2 shadow-lg mb-4 flex-row items-center">
              <Text className="text-xl mr-2">🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search projects..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-gray-900 text-base py-2"
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Text className="text-gray-400 text-lg">✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Type Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pb-2">
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
                <TouchableOpacity
                  onPress={() => applyFilter("shortStory")}
                  className={`px-5 py-3 rounded-full ${
                    filterType === "shortStory" ? "bg-primary" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      filterType === "shortStory" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    📝 Stories
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => applyFilter("manuscript")}
                  className={`px-5 py-3 rounded-full ${
                    filterType === "manuscript" ? "bg-primary" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      filterType === "manuscript" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    📄 Manuscripts
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <View className="bg-white rounded-2xl p-4 mt-4 shadow-lg">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Sort & Filter
                </Text>
                
                {/* Sort Options */}
                <Text className="text-sm font-semibold text-gray-700 mb-2">Sort by:</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { value: "updated", label: "Last Updated" },
                    { value: "created", label: "Date Created" },
                    { value: "title", label: "Title A-Z" },
                    { value: "wordcount", label: "Word Count" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setSortBy(option.value as any);
                        applySorting(filteredProjects);
                      }}
                      className={`px-4 py-2 rounded-full ${
                        sortBy === option.value ? "bg-primary" : "bg-light-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          sortBy === option.value ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Genre Filter */}
                {uniqueGenres.length > 0 && (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Filter by genre:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2 mb-2">
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedGenre(null);
                            applyFilter(filterType);
                          }}
                          className={`px-4 py-2 rounded-full ${
                            !selectedGenre ? "bg-primary" : "bg-light-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              !selectedGenre ? "text-white" : "text-gray-600"
                            }`}
                          >
                            All Genres
                          </Text>
                        </TouchableOpacity>
                        {uniqueGenres.map((genre) => (
                          <TouchableOpacity
                            key={genre}
                            onPress={() => {
                              setSelectedGenre(genre);
                              applyFilter(filterType);
                            }}
                            className={`px-4 py-2 rounded-full ${
                              selectedGenre === genre ? "bg-primary" : "bg-light-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selectedGenre === genre ? "text-white" : "text-gray-600"
                              }`}
                            >
                              {genre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}
              </View>
            )}
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
              <Text className="text-sm text-gray-600 text-center px-8 mb-6">
                {searchQuery
                  ? "Try a different search term or adjust your filters"
                  : "Start creating your first masterpiece!"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => router.push("/create")}
                  className="bg-secondary px-8 py-4 rounded-full"
                >
                  <Text className="text-gray-900 font-bold text-base">
                    ✨ Create Project
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Background>
  );
};

export default search;