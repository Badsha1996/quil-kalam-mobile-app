import Background from "@/components/common/Background";
import { PublishedProject } from "@/types/published";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  getPublishedProjects,
  unpublishProject,
  getPublishedProjectItems,
  trackProjectView,
  likeProject,
  unlikeProject,
  isAuthenticated,
} from "@/utils/api";

const { width } = Dimensions.get("window");

const PublishedWorks = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<PublishedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PublishedProject[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(
    "recent"
  );
  const [selectedProject, setSelectedProject] =
    useState<PublishedProject | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookContent, setBookContent] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [upcoming, setUpcoming] = useState(true);

  useEffect(() => {
    loadPublishedWorks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedGenre, sortBy, projects]);

  const loadPublishedWorks = async () => {
    try {
      setLoading(true);

      // Call API without filters to avoid parameter binding issues
      const response = await getPublishedProjects();

      // Handle different response formats
      if (response?.success && response?.projects) {
        setProjects(response.projects);
      } else if (response?.projects) {
        setProjects(response.projects);
      } else if (Array.isArray(response)) {
        setProjects(response);
      } else {
        console.warn("Unexpected response format:", response);
        setProjects([]);
      }
    } catch (error: any) {
      console.error("Error loading published works:", error);

      // Only show alert if not initial load and not a refresh
      if (!loading && !refreshing) {
        Alert.alert(
          "Error",
          error?.message || "Failed to load published works. Please try again."
        );
      }

      // Set empty array on error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPublishedWorks();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter((p) => p.genre === selectedGenre);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.like_count || 0) - (a.like_count || 0);
        case "trending":
          return (b.view_count || 0) - (a.view_count || 0);
        case "recent":
        default:
          return (
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
          );
      }
    });

    setFilteredProjects(filtered);
  };

  const handleProjectClick = async (project: PublishedProject) => {
    setSelectedProject(project);
    setIsLiked(false); // Reset like state

    // Track view
    try {
      await trackProjectView(project.id);
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleReadBook = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const response = await getPublishedProjectItems(selectedProject.id);

      if (response.success && response.items) {
        setBookContent(response.items);
        setShowReader(true);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error loading book content:", error);
      Alert.alert("Error", "Failed to load book content");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (projectId: string) => {
    if (!isAuthenticated()) {
      Alert.alert("Sign In Required", "Please sign in to like projects");
      return;
    }

    try {
      if (isLiked) {
        await unlikeProject(projectId);
        setIsLiked(false);
        Alert.alert("Success", "Removed from favorites");
      } else {
        await likeProject(projectId);
        setIsLiked(true);
        Alert.alert("Success", "Added to favorites!");
      }

      // Refresh to get updated counts
      await loadPublishedWorks();
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  const handleDelete = async (projectId: string) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to unpublish this project? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await unpublishProject(projectId);
              Alert.alert("Success", "Project unpublished successfully");
              setSelectedProject(null);
              await loadPublishedWorks();
            } catch (error) {
              console.error("Error deleting project:", error);
              Alert.alert("Error", "Failed to unpublish project");
            }
          },
        },
      ]
    );
  };

  const uniqueGenres = Array.from(
    new Set(projects.map((p) => p.genre).filter(Boolean))
  );

  if (loading && !refreshing) {
    return (
      <Background>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF6B9D" />
          <Text className="text-gray-600 dark:text-light-200 mt-4">
            Loading published works...
          </Text>
        </View>
      </Background>
    );
  }

  if (upcoming) {
    return (
      <Background>
        <View className="flex-1 justify-center items-center">
          {/* <ActivityIndicator size="large" color="#FF6B9D" /> */}
          <Text className="text-gray-600 dark:text-light-200 mt-4">
            This is an upcoming feature 😩
          </Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B9D"]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-4xl font-bold text-gray-900 dark:text-light-100 mb-2">
                Discover
              </Text>
              <Text className="text-base text-gray-600 dark:text-light-200">
                {filteredProjects.length} published{" "}
                {filteredProjects.length === 1 ? "work" : "works"}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="bg-white dark:bg-dark-200 rounded-2xl px-4 py-2 shadow-lg mb-4 flex-row items-center">
            <Text className="text-xl mr-2">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search published works..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-900 dark:text-light-100 text-base py-2"
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text className="text-gray-400 text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Options */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              {[
                { value: "recent", label: "Recent", icon: "🕒" },
                { value: "popular", label: "Popular", icon: "❤️" },
                { value: "trending", label: "Trending", icon: "🔥" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSortBy(option.value as any)}
                  className={`px-5 py-3 rounded-full ${
                    sortBy === option.value
                      ? "bg-primary"
                      : "bg-white dark:bg-dark-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      sortBy === option.value
                        ? "text-white"
                        : "text-gray-600 dark:text-light-200"
                    }`}
                  >
                    {option.icon} {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Genre Filter */}
          {uniqueGenres.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setSelectedGenre(null)}
                  className={`px-4 py-2 rounded-full ${
                    !selectedGenre
                      ? "bg-secondary"
                      : "bg-white dark:bg-dark-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      !selectedGenre
                        ? "text-gray-900"
                        : "text-gray-600 dark:text-light-200"
                    }`}
                  >
                    All Genres
                  </Text>
                </TouchableOpacity>
                {uniqueGenres.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    onPress={() => setSelectedGenre(genre)}
                    className={`px-4 py-2 rounded-full ${
                      selectedGenre === genre
                        ? "bg-secondary"
                        : "bg-white dark:bg-dark-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selectedGenre === genre
                          ? "text-gray-900"
                          : "text-gray-600 dark:text-light-200"
                      }`}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Published Works Grid */}
        <View className="px-6">
          {filteredProjects.length > 0 ? (
            <View className="flex-row flex-wrap gap-4">
              {filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => handleProjectClick(project)}
                  className="bg-white dark:bg-dark-200 rounded-3xl shadow-lg overflow-hidden"
                  style={{ width: (width - 64) / 2 }}
                >
                  {project.cover_image_url ? (
                    <Image
                      source={{ uri: project.cover_image_url }}
                      className="w-full h-48"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-48 bg-gradient-to-br from-primary to-purple-600 justify-center items-center">
                      <Text className="text-6xl">📖</Text>
                    </View>
                  )}

                  <View className="p-4">
                    <Text
                      className="text-lg font-bold text-gray-900 dark:text-light-100 mb-1"
                      numberOfLines={2}
                    >
                      {project.title}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-light-200 mb-2">
                      by {project.author_name || "Anonymous"}
                    </Text>

                    {project.genre && (
                      <View className="bg-light-100 dark:bg-dark-100 px-2 py-1 rounded-full self-start mb-2">
                        <Text className="text-xs font-semibold text-gray-700 dark:text-light-200">
                          {project.genre}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm">👁️</Text>
                          <Text className="text-xs text-gray-600 dark:text-light-200">
                            {project.view_count || 0}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm">❤️</Text>
                          <Text className="text-xs text-gray-600 dark:text-light-200">
                            {project.like_count || 0}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-light-200">
                        {project.word_count?.toLocaleString() || 0} words
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-16">
              <Text className="text-6xl mb-4">📚</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                No works found
              </Text>
              <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8">
                {searchQuery || selectedGenre
                  ? "Try adjusting your search or filters"
                  : "Be the first to publish a work!"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Project Details Modal */}
      <Modal
        visible={!!selectedProject && !showReader}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProject(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-white dark:bg-dark-200 rounded-t-3xl max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProject?.cover_image_url ? (
                <Image
                  source={{ uri: selectedProject.cover_image_url }}
                  className="w-full h-64"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-64 bg-gradient-to-br from-primary to-purple-600 justify-center items-center">
                  <Text className="text-8xl">📖</Text>
                </View>
              )}

              <View className="p-6">
                <Text className="text-3xl font-bold text-gray-900 dark:text-light-100 mb-2">
                  {selectedProject?.title}
                </Text>
                <Text className="text-lg text-gray-600 dark:text-light-200 mb-4">
                  by {selectedProject?.author_name || "Anonymous"}
                </Text>

                {selectedProject?.genre && (
                  <View className="flex-row gap-2 mb-4">
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-sm font-semibold text-primary">
                        {selectedProject.genre}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center gap-4 mb-6">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl">👁️</Text>
                    <Text className="text-sm font-semibold text-gray-900 dark:text-light-100">
                      {selectedProject?.view_count || 0}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl">❤️</Text>
                    <Text className="text-sm font-semibold text-gray-900 dark:text-light-100">
                      {selectedProject?.like_count || 0}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl">💬</Text>
                    <Text className="text-sm font-semibold text-gray-900 dark:text-light-100">
                      {selectedProject?.comment_count || 0}
                    </Text>
                  </View>
                </View>

                <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-6">
                  <Text className="text-sm text-gray-700 dark:text-light-200 mb-2">
                    Word Count
                  </Text>
                  <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                    {selectedProject?.word_count?.toLocaleString() || 0}
                  </Text>
                </View>

                {selectedProject?.description && (
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-2">
                      About this work
                    </Text>
                    <Text className="text-base text-gray-700 dark:text-light-200 leading-6">
                      {selectedProject.description}
                    </Text>
                  </View>
                )}

                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={handleReadBook}
                    className="flex-1 bg-primary py-4 rounded-full"
                  >
                    <Text className="text-white font-bold text-center text-lg">
                      📖 Read Now
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleLike(selectedProject?.id || "")}
                    className={`px-6 py-4 rounded-full ${
                      isLiked ? "bg-red-100" : "bg-secondary"
                    }`}
                  >
                    <Text className="text-2xl">{isLiked ? "💗" : "❤️"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Button - Only show if authenticated */}
                {isAuthenticated() && (
                  <TouchableOpacity
                    onPress={() => handleDelete(selectedProject?.id || "")}
                    className="bg-red-50 dark:bg-red-900/20 py-3 rounded-full mb-2"
                  >
                    <Text className="text-red-600 dark:text-red-400 font-semibold text-center">
                      🗑️ Unpublish Project
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setSelectedProject(null)}
                  className="py-3"
                >
                  <Text className="text-gray-600 dark:text-light-200 font-semibold text-center">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Book Reader Modal */}
      <Modal
        visible={showReader}
        animationType="slide"
        onRequestClose={() => {
          setShowReader(false);
          setCurrentPage(0);
        }}
      >
        <View className="flex-1 bg-gray-900">
          {/* Reader Header */}
          <View className="px-6 pt-16 pb-4 bg-black/50">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setShowReader(false);
                  setCurrentPage(0);
                }}
                className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
              >
                <Text className="text-xl text-white">←</Text>
              </TouchableOpacity>
              <View className="flex-1 mx-4">
                <Text
                  className="text-lg font-bold text-white text-center"
                  numberOfLines={1}
                >
                  {selectedProject?.title}
                </Text>
                <Text className="text-xs text-white/70 text-center">
                  by {selectedProject?.author_name}
                </Text>
              </View>
              <View className="w-10" />
            </View>
          </View>

          {/* Book Pages */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const pageNum = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPage(pageNum);
            }}
            scrollEventThrottle={16}
          >
            {/* Cover Page */}
            <View className="items-center justify-center" style={{ width }}>
              <View className="items-center">
                {selectedProject?.cover_image_url ? (
                  <Image
                    source={{ uri: selectedProject.cover_image_url }}
                    className="rounded-2xl shadow-2xl"
                    style={{ width: width * 0.7, height: width * 1.05 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-2xl justify-center items-center"
                    style={{ width: width * 0.7, height: width * 1.05 }}
                  >
                    <Text className="text-8xl mb-4">📖</Text>
                    <Text className="text-2xl font-bold text-white text-center px-6">
                      {selectedProject?.title}
                    </Text>
                  </View>
                )}
                <Text className="text-white text-sm mt-4">Swipe to read →</Text>
              </View>
            </View>

            {/* Content Pages */}
            {bookContent.map((item, index) => (
              <View
                key={item.id}
                className="px-8 py-12 justify-center"
                style={{ width }}
              >
                <View
                  className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-2xl"
                  style={{ height: width * 1.2 }}
                >
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4">
                    {item.name}
                  </Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-base text-gray-800 dark:text-light-200 leading-7">
                      {item.content}
                    </Text>
                  </ScrollView>
                  <View className="absolute bottom-6 left-0 right-0">
                    <Text className="text-xs text-gray-500 dark:text-light-200 text-center">
                      Page {index + 1} of {bookContent.length}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* End Page */}
            <View
              className="items-center justify-center px-8"
              style={{ width }}
            >
              <View
                className="bg-white dark:bg-dark-200 rounded-2xl p-8 items-center shadow-2xl"
                style={{ width: width * 0.8 }}
              >
                <Text className="text-6xl mb-4">✨</Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-2 text-center">
                  The End
                </Text>
                <Text className="text-base text-gray-600 dark:text-light-200 text-center mb-6">
                  Thank you for reading {selectedProject?.title}
                </Text>

                <TouchableOpacity
                  onPress={() => handleLike(selectedProject?.id || "")}
                  className="bg-primary px-8 py-4 rounded-full mb-3"
                >
                  <Text className="text-white font-bold text-center">
                    ❤️ Like this work
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowReader(false);
                    setCurrentPage(0);
                  }}
                  className="bg-light-100 dark:bg-dark-100 px-8 py-4 rounded-full"
                >
                  <Text className="text-gray-900 dark:text-light-100 font-bold text-center">
                    Close Reader
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Page Indicator */}
          <View className="absolute bottom-8 left-0 right-0 items-center">
            <View className="bg-black/70 px-6 py-3 rounded-full">
              <Text className="text-white font-bold">
                {currentPage === 0
                  ? "Cover"
                  : currentPage > bookContent.length
                  ? "End"
                  : `${currentPage} / ${bookContent.length}`}
              </Text>
            </View>
          </View>

          {/* Reading Progress Bar */}
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <View
              className="h-full bg-primary"
              style={{
                width: `${
                  ((currentPage + 1) / (bookContent.length + 2)) * 100
                }%`,
              }}
            />
          </View>
        </View>
      </Modal>
    </Background>
  );
};

export default PublishedWorks;
