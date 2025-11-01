import Background from "@/components/common/Background";
import ProjectCard from "@/components/search/ProjectCard";
import { SortedOption, writingTypes } from "@/constants/search";
import { Project } from "@/types/search";
import {
  deleteProject,
  getAllProjects,
  searchProjects,
} from "@/utils/database";
// @ts-ignore
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const search = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "novel" | "poetry" | "shortStory" | "manuscript"
  >("all");
  const [sortBy, setSortBy] = useState<
    "updated" | "created" | "title" | "wordcount"
  >("updated");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;

  // ************************************ EFFECTS **********************************
  useEffect(() => {
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

  // ************************************ Functions Definations **********************************

  const loadProjects = () => {
    const allProjects = getAllProjects() as Project[];
    setProjects(allProjects);
    applyAllFilters(allProjects);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyAllFilters(projects, query);
  };

  const applyAllFilters = (projectList: Project[], query?: string) => {
    const searchTerm = query !== undefined ? query : searchQuery;
    let filtered = projectList;

    // Search filter
    if (searchTerm.trim() !== "") {
      const results = searchProjects(searchTerm) as Project[];
      filtered = results;
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // Genre filter
    if (selectedGenre) {
      filtered = filtered.filter((p) => p.genre === selectedGenre);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // Apply sorting
    applySorting(filtered);
  };

  const applyFilter = (
    type: "all" | "novel" | "poetry" | "shortStory" | "manuscript"
  ) => {
    setFilterType(type);
    let filtered = projects;

    if (searchQuery.trim() !== "") {
      filtered = searchProjects(searchQuery) as Project[];
    }

    if (type !== "all") {
      filtered = filtered.filter((p) => p.type === type);
    }

    if (selectedGenre) {
      filtered = filtered.filter((p) => p.genre === selectedGenre);
    }

    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    applySorting(filtered);
  };

  const applySorting = (projectsToSort: Project[]) => {
    const sorted = [...projectsToSort].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "wordcount":
          return (b.word_count || 0) - (a.word_count || 0);
        case "created":
          return (b.created_at || 0) - (a.created_at || 0);
        case "updated":
        default:
          return (b.updated_at || 0) - (a.updated_at || 0);
      }
    });
    setFilteredProjects(sorted);
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    applySorting(filteredProjects);
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

  const handleGenreFilter = (genre: string | null) => {
    setSelectedGenre(genre);
    applyAllFilters(projects);
  };

  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    applyAllFilters(projects);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedGenre(null);
    setSelectedStatus(null);
    setSortBy("updated");
    setFilteredProjects(projects);
  };

  // ************************************ maps and Reducers **********************************

  const uniqueGenres = Array.from(
    new Set(projects.map((p) => p.genre).filter(Boolean))
  );

  const uniqueStatuses = Array.from(
    new Set(projects.map((p) => p.status).filter(Boolean))
  );

  const activeFilterCount = [
    filterType !== "all" ? 1 : 0,
    selectedGenre ? 1 : 0,
    selectedStatus ? 1 : 0,
    searchQuery ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-16 pb-6">
          <Animated.View
            style={{
              opacity: heroFade,
              transform: [{ translateY: heroSlide }],
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-4xl font-bold text-gray-900 dark:text-light-100 mb-2">
                  My Library
                </Text>
                <Text className="text-base text-gray-600 dark:text-light-200">
                  {filteredProjects.length}{" "}
                  {filteredProjects.length === 1 ? "project" : "projects"}
                  {activeFilterCount > 0 && ` (${activeFilterCount} filters)`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="w-12 h-12 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg relative"
              >
                <Text className="text-2xl">⚙️</Text>
                {activeFilterCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View className="bg-white dark:bg-dark-200 rounded-2xl px-4 py-2 shadow-lg mb-4 flex-row items-center">
              <Text className="text-xl mr-2">🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search projects..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-gray-900 dark:text-light-100 text-base py-2"
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Text className="text-gray-400 text-lg">✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pb-2">
                {writingTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => applyFilter(type.value as any)}
                    className={`px-5 py-3 rounded-full ${
                      filterType === type.value
                        ? "bg-primary"
                        : "bg-white dark:bg-dark-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        filterType === type.value
                          ? "text-white"
                          : "text-gray-600 dark:text-light-200"
                      }`}
                    >
                      {type.icon} {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {showFilters && (
              <View className="bg-white dark:bg-dark-200 rounded-2xl p-4 mt-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                    Filters & Sort
                  </Text>
                  {activeFilterCount > 0 && (
                    <TouchableOpacity onPress={clearAllFilters}>
                      <Text className="text-sm text-primary font-semibold">
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                  Sort by:
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {SortedOption.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleSortChange(option.value as any)}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        sortBy === option.value
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text className="mr-1">{option.icon}</Text>
                      <Text
                        className={`text-xs font-semibold ${
                          sortBy === option.value
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {uniqueStatuses.length > 0 && (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                      Status:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row gap-2 mb-4">
                        <TouchableOpacity
                          onPress={() => handleStatusFilter(null)}
                          className={`px-4 py-2 rounded-full ${
                            !selectedStatus
                              ? "bg-primary"
                              : "bg-light-100 dark:bg-dark-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              !selectedStatus
                                ? "text-white"
                                : "text-gray-600 dark:text-light-200"
                            }`}
                          >
                            All Status
                          </Text>
                        </TouchableOpacity>
                        {uniqueStatuses.map((status) => (
                          <TouchableOpacity
                            key={status}
                            onPress={() => handleStatusFilter(status)}
                            className={`px-4 py-2 rounded-full ${
                              selectedStatus === status
                                ? "bg-primary"
                                : "bg-light-100 dark:bg-dark-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold capitalize ${
                                selectedStatus === status
                                  ? "text-white"
                                  : "text-gray-600 dark:text-light-200"
                              }`}
                            >
                              {status}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                {uniqueGenres.length > 0 && (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                      Genre:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row gap-2 mb-2">
                        <TouchableOpacity
                          onPress={() => handleGenreFilter(null)}
                          className={`px-4 py-2 rounded-full ${
                            !selectedGenre
                              ? "bg-primary"
                              : "bg-light-100 dark:bg-dark-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              !selectedGenre
                                ? "text-white"
                                : "text-gray-600 dark:text-light-200"
                            }`}
                          >
                            All Genres
                          </Text>
                        </TouchableOpacity>
                        {uniqueGenres.map((genre) => (
                          <TouchableOpacity
                            key={genre}
                            onPress={() => handleGenreFilter(genre)}
                            className={`px-4 py-2 rounded-full ${
                              selectedGenre === genre
                                ? "bg-primary"
                                : "bg-light-100 dark:bg-dark-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selectedGenre === genre
                                  ? "text-white"
                                  : "text-gray-600 dark:text-light-200"
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

        <View className="px-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                handleDeleteProject={handleDeleteProject}
              />
            ))
          ) : (
            <View className="items-center py-16">
              <Text className="text-6xl mb-4">
                {searchQuery || activeFilterCount > 0 ? "🔍" : "📚"}
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                {searchQuery || activeFilterCount > 0
                  ? "No results found"
                  : "No projects yet"}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8 mb-6">
                {searchQuery || activeFilterCount > 0
                  ? "Try adjusting your search or filters"
                  : "Start creating your first masterpiece!"}
              </Text>
              {!searchQuery && activeFilterCount === 0 && (
                <TouchableOpacity
                  onPress={() => router.push("/create")}
                  className="bg-secondary px-8 py-4 rounded-full"
                >
                  <Text className="text-gray-900 font-bold text-base">
                    Create Project
                  </Text>
                </TouchableOpacity>
              )}
              {(searchQuery || activeFilterCount > 0) && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  className="bg-primary px-8 py-3 rounded-full"
                >
                  <Text className="text-white font-bold text-sm">
                    Clear Filters
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
