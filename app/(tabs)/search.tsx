import Background from "@/components/common/Background";
import ProjectCard from "@/components/search/ProjectCard";
import { Project } from "@/types/search";
import {
  deleteProject,
  getAllProjects,
  getProjectsByType,
  searchProjects,
} from "@/utils/database";
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

  // ********************************** Animation **********************************
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;

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

  // ********************************** Function Definations **********************************

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

  const applyFilter = (
    type: "all" | "novel" | "poetry" | "shortStory" | "manuscript"
  ) => {
    setFilterType(type);
    let filtered: Project[];

    if (type === "all") {
      filtered =
        searchQuery.trim() === ""
          ? projects
          : (searchProjects(searchQuery) as Project[]);
    } else {
      filtered =
        searchQuery.trim() === ""
          ? (getProjectsByType(type) as Project[])
          : (searchProjects(searchQuery) as Project[]).filter(
              (p) => p.type === type
            );
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
  const uniqueGenres = Array.from(
    new Set(projects.map((p) => p.genre).filter(Boolean))
  );

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
                  {searchQuery && " found"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="w-12 h-12 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
              >
                <Text className="text-2xl">⚙️</Text>
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
                <TouchableOpacity
                  onPress={() => applyFilter("all")}
                  className={`px-5 py-3 rounded-full ${
                    filterType === "all" ? "bg-primary" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      filterType === "all"
                        ? "text-white dark:text-dark-100"
                        : "text-gray-600"
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
                    ✍🏻 Poetry
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
                      filterType === "shortStory"
                        ? "text-white"
                        : "text-gray-600"
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
                      filterType === "manuscript"
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    📄 Manuscripts
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <View className="bg-white dark:bg-dark-200 rounded-2xl p-4 mt-4 shadow-lg">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  Sort & Filter
                </Text>

                {/* Sort Options */}
                <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                  Sort by:
                </Text>
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
                          sortBy === option.value
                            ? "text-white dark:text-dark-100"
                            : "text-gray-600"
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
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Filter by genre:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
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
                              selectedGenre === genre
                                ? "bg-primary"
                                : "bg-light-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selectedGenre === genre
                                  ? "text-white"
                                  : "text-gray-600"
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
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                handleDeleteProject={handleDeleteProject}
              />
            ))
          ) : (
            <View className="items-center py-16">
              <Text className="text-6xl mb-4">📚</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                {searchQuery ? "No results found" : "No projects yet"}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8 mb-6">
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
