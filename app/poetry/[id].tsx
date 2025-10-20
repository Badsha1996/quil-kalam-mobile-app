import Background from "@/components/common/Background";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  exportProjectAsJSON,
  getFilesByProject,
  getFoldersByProject,
  getProject,
  getProjectStats,
  updateFile,
  updateProject,
} from "@/utils/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Poetry form templates
const poetryForms = [
  {
    value: "freeform",
    label: "Free Verse",
    desc: "No structure - pure expression",
    icon: "🎨",
  },
  {
    value: "sonnet",
    label: "Sonnet",
    desc: "14 lines with rhyme scheme",
    icon: "🌹",
  },
  {
    value: "haiku",
    label: "Haiku",
    desc: "3 lines: 5-7-5 syllables",
    icon: "🍃",
  },
  {
    value: "limerick",
    label: "Limerick",
    desc: "5 lines, AABBA rhyme",
    icon: "😄",
  },
  {
    value: "villanelle",
    label: "Villanelle",
    desc: "19 lines, repeating refrains",
    icon: "🔄",
  },
  {
    value: "ballad",
    label: "Ballad",
    desc: "Narrative poem in stanzas",
    icon: "🎭",
  },
];

const PoetryDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoem, setEditingPoem] = useState<any>(null);
  const [newPoemTitle, setNewPoemTitle] = useState("");
  const [newPoemContent, setNewPoemContent] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(
    null
  );
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProjectData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  const loadProjectData = () => {
    const projectData = getProject(projectId);
    const statsData = getProjectStats(projectId);
    const foldersData = getFoldersByProject(projectId);
    const filesData = getFilesByProject(projectId);

    setProject(projectData);
    setStats(statsData);
    setFolders(foldersData || []);
    setPoems(filesData || []);
  };

  const toggleHeaderMinimize = () => {
    const toValue = isHeaderMinimized ? 1 : 0;
    setIsHeaderMinimized(!isHeaderMinimized);

    Animated.timing(headerHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleAddPoem = () => {
    if (!newPoemTitle.trim()) {
      Alert.alert("Error", "Please enter a title for your poem");
      return;
    }

    try {
      createFile({
        projectId,
        folderId: selectedCollection || undefined,
        fileType: "document",
        name: newPoemTitle,
        content: newPoemContent,
        orderIndex: poems.length,
      });

      setShowAddModal(false);
      setNewPoemTitle("");
      setNewPoemContent("");
      setSelectedCollection(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to create poem");
    }
  };

  const handleAddCollection = () => {
    Alert.prompt("New Collection", "Enter collection name", (text) => {
      if (text && text.trim()) {
        createFolder({
          projectId,
          name: text,
          folderType: "section",
          orderIndex: folders.length,
        });
        loadProjectData();
      }
    });
  };

  const handleEditPoem = (poem: any) => {
    setEditingPoem(poem);
  };

  const handleSavePoem = () => {
    if (!editingPoem) return;

    try {
      updateFile(editingPoem.id, {
        name: editingPoem.name,
        content: editingPoem.content,
      });
      setEditingPoem(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to update poem");
    }
  };

  const handleDeletePoem = (id: number, title: string) => {
    Alert.alert("Delete Poem", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFile(id);
          loadProjectData();
        },
      },
    ]);
  };

  const handleDeleteCollection = (id: number, name: string) => {
    Alert.alert("Delete Collection", `Delete "${name}" and all its poems?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFolder(id);
          loadProjectData();
        },
      },
    ]);
  };

  const handleExport = () => {
    try {
      const jsonData = exportProjectAsJSON(projectId);
      if (jsonData) {
        Alert.alert("Export Ready", "Poetry collection exported successfully!");
        console.log("Exported data:", jsonData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export project");
    }
  };

  const handleUpdateStatus = () => {
    const statuses = [
      "draft",
      "in_progress",
      "revision",
      "complete",
      "published",
    ];
    const currentIndex = statuses.indexOf(project.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    updateProject(projectId, { status: nextStatus });
    loadProjectData();
  };

  const handleUpdateForm = (formType: string) => {
    //@ts-ignore
    updateProject(projectId, { writing_template: formType });
    loadProjectData();
    setShowFormModal(false);
  };

  const countLines = (text: string) => {
    if (!text) return 0;
    return text.split("\n").filter((line) => line.trim()).length;
  };

  const countStanzas = (text: string) => {
    if (!text) return 0;
    return text.split(/\n\s*\n/).filter((stanza) => stanza.trim()).length;
  };

  if (!project) {
    return (
      <Background>
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl text-gray-600 dark:text-light-200">
            Loading...
          </Text>
        </View>
      </Background>
    );
  }

  const progress = stats?.targetWordCount
    ? (stats.wordCount / stats.targetWordCount) * 100
    : 0;

  const renderHeaderButtons = () => (
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => setShowFormModal(true)}
        className="bg-white dark:bg-dark-200 px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
          🎨 Form
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowBookPreview(true)}
        className="bg-primary px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-white">👁️ Preview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={toggleHeaderMinimize}
        className="w-10 h-10 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
      >
        <Text className="text-xl dark:text-light-100">
          {isHeaderMinimized ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Background>
      <View className="flex-1">
        {/* Collapsible Header */}
        <Animated.View
          style={{
            height: headerHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [80, 400],
            }),
          }}
        >
          <View className="px-6 pt-16 ">
            <View className="flex-row justify-between items-center mb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
              >
                <Text className="text-xl dark:text-light-100">←</Text>
              </TouchableOpacity>
              {renderHeaderButtons()}
            </View>

            {!isHeaderMinimized && (
              <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
                <View className="flex-row items-start mb-4">
                  <View className="w-16 h-16 rounded-2xl bg-secondary justify-center items-center mr-4">
                    <Text className="text-4xl">✍️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-2">
                      {project.title}
                    </Text>
                    {project.author_name && (
                      <Text className="text-sm text-gray-600 dark:text-light-200 mb-2">
                        by {project.author_name}
                      </Text>
                    )}
                    <View className="flex-row gap-2 flex-wrap">
                      <TouchableOpacity
                        onPress={handleUpdateStatus}
                        className="bg-primary px-3 py-1 rounded-full"
                      >
                        <Text className="text-white dark:text-dark-100 text-xs font-bold">
                          {project.status.replace("_", " ").toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                      {project.genre && (
                        <View className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                          <Text className="text-gray-600 dark:text-light-200 text-xs font-semibold">
                            {project.genre}
                          </Text>
                        </View>
                      )}
                      {project.writing_template && (
                        <View className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                          <Text className="text-gray-600 dark:text-light-200 text-xs font-semibold">
                            {poetryForms.find(
                              (f) => f.value === project.writing_template
                            )?.label || "Free Verse"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {project.description && (
                  <Text className="text-sm text-gray-600 dark:text-light-200 italic mb-4">
                    "{project.description}"
                  </Text>
                )}

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Total Poems
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {poems.length}
                    </Text>
                  </View>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Collections
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {folders.length}
                    </Text>
                  </View>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Total Words
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {stats?.wordCount?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Avg per Poem
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {poems.length > 0
                        ? Math.round((stats?.wordCount || 0) / poems.length)
                        : 0}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {project.target_word_count > 0 && (
                  <View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm font-semibold text-gray-700 dark:text-light-100">
                        Progress: {progress.toFixed(1)}%
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Target: {project.target_word_count.toLocaleString()}
                      </Text>
                    </View>
                    <View className="h-3 bg-light-100 dark:bg-dark-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 "
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }} className="px-6 py-10">
            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-6 ">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-secondary py-4 rounded-2xl shadow-lg"
              >
                <Text className="text-gray-900 dark:text-dark-300 font-bold text-center">
                  ✨ New Poem
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCollection}
                className="bg-white dark:bg-dark-200 py-4 px-6 rounded-2xl border-2 border-primary shadow-lg"
              >
                <Text className="text-primary font-bold text-center text-xl">
                  📚
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                className="bg-white dark:bg-dark-200 py-4 px-6 rounded-2xl border-2 border-primary shadow-lg"
              >
                <Text className="text-primary font-bold text-center text-xl">
                  📤
                </Text>
              </TouchableOpacity>
            </View>

            {/* Collections */}
            {folders.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
                  Collections
                </Text>
                {folders.map((collection) => {
                  const collectionPoems = poems.filter(
                    (p) => p.folder_id === collection.id
                  );
                  return (
                    <TouchableOpacity
                      key={collection.id}
                      onLongPress={() =>
                        handleDeleteCollection(collection.id, collection.name)
                      }
                      className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg active:opacity-80"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mr-3">
                            <Text className="text-2xl">📚</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                              {collection.name}
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              {collectionPoems.length}{" "}
                              {collectionPoems.length === 1 ? "poem" : "poems"}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-400 dark:text-light-200 text-xl">
                          ›
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Poems List */}
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
                All Poems ({poems.length})
              </Text>
              {poems.length > 0 ? (
                poems.map((poem, index) => {
                  const lines = countLines(poem.content || "");
                  const stanzas = countStanzas(poem.content || "");

                  return (
                    <TouchableOpacity
                      key={poem.id}
                      onPress={() => handleEditPoem(poem)}
                      onLongPress={() => handleDeletePoem(poem.id, poem.name)}
                      className="bg-white dark:bg-dark-200 rounded-2xl p-5 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-2">
                            {poem.name}
                          </Text>
                          <View className="flex-row gap-3">
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              📝 {poem.word_count || 0} words
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              📄 {lines} lines
                            </Text>
                            {stanzas > 1 && (
                              <Text className="text-xs text-gray-500 dark:text-light-200">
                                🔲 {stanzas} stanzas
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-light-100 dark:bg-dark-100 justify-center items-center">
                          <Text className="text-gray-600 dark:text-light-200 font-bold text-xs">
                            {index + 1}
                          </Text>
                        </View>
                      </View>

                      {poem.content && (
                        <View className="bg-light-100 dark:bg-dark-100 rounded-xl p-3">
                          <Text
                            className="text-sm text-gray-700 dark:text-light-200 italic leading-5 font-serif"
                            numberOfLines={4}
                          >
                            {poem.content}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="bg-white dark:bg-dark-200 rounded-2xl p-10 items-center">
                  <Text className="text-6xl mb-3">✍️</Text>
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
                    No poems yet
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200 text-center mb-4">
                    Start writing your first verse
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    className="bg-secondary px-6 py-3 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-dark-300 font-bold">
                      ✨ Write Poem
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Add Poem Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-white dark:bg-dark-200 rounded-t-3xl p-6"
            style={{ maxHeight: "90%" }}
          >
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4">
              ✨ New Poem
            </Text>

            <TextInput
              value={newPoemTitle}
              onChangeText={setNewPoemTitle}
              placeholder="Untitled Poem"
              placeholderTextColor="#9CA3AF"
              className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-lg font-bold"
            />

            <ScrollView className="mb-4" style={{ maxHeight: 300 }}>
              <TextInput
                value={newPoemContent}
                onChangeText={setNewPoemContent}
                placeholder="Write your verses here...&#10;&#10;Press return twice for stanzas"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100 font-serif"
                style={{ minHeight: 250 }}
              />
            </ScrollView>

            {folders.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                  Add to Collection (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedCollection(null)}
                      className={`px-4 py-2 rounded-full ${
                        !selectedCollection
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          !selectedCollection
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {folders.map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        onPress={() => setSelectedCollection(folder.id)}
                        className={`px-4 py-2 rounded-full ${
                          selectedCollection === folder.id
                            ? "bg-primary"
                            : "bg-light-100 dark:bg-dark-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            selectedCollection === folder.id
                              ? "text-white"
                              : "text-gray-600 dark:text-light-200"
                          }`}
                        >
                          {folder.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewPoemTitle("");
                  setNewPoemContent("");
                  setSelectedCollection(null);
                }}
                className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
              >
                <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddPoem}
                className="flex-1 bg-secondary py-4 rounded-full"
              >
                <Text className="text-gray-900 dark:text-dark-300 font-bold text-center">
                  Save Poem
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Poem Modal */}
      <Modal
        visible={!!editingPoem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingPoem(null)}
      >
        <View className="flex-1 bg-white dark:bg-dark-300">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setEditingPoem(null)}
                className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
              >
                <Text className="text-xl dark:text-light-100">✕</Text>
              </TouchableOpacity>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (editingPoem) {
                      handleDeletePoem(editingPoem.id, editingPoem.name);
                      setEditingPoem(null);
                    }
                  }}
                  className="bg-red-100 px-4 py-3 rounded-full"
                >
                  <Text className="text-red-600 font-bold">Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSavePoem}
                  className="bg-secondary px-6 py-3 rounded-full"
                >
                  <Text className="text-gray-900 dark:text-dark-300 font-bold">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              value={editingPoem?.name || ""}
              onChangeText={(text) =>
                setEditingPoem({ ...editingPoem, name: text })
              }
              placeholder="Poem Title"
              placeholderTextColor="#9CA3AF"
              className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-xl font-bold"
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <TextInput
                value={editingPoem?.content || ""}
                onChangeText={(text) =>
                  setEditingPoem({ ...editingPoem, content: text })
                }
                placeholder="Write your verses here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="bg-white dark:bg-dark-200 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100 text-base font-serif leading-7"
                style={{ minHeight: 500 }}
              />

              <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mt-4">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Words:{" "}
                    {editingPoem?.content?.trim().split(/\s+/).filter(Boolean)
                      .length || 0}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Lines: {countLines(editingPoem?.content || "")}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Stanzas: {countStanzas(editingPoem?.content || "")}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Poetry Form Modal */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
              Choose Poetry Form
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
                Select a poetic form to guide your writing
              </Text>

              {poetryForms.map((form) => (
                <TouchableOpacity
                  key={form.value}
                  onPress={() => handleUpdateForm(form.value)}
                  className={`p-4 rounded-2xl mb-3 border-2 ${
                    project?.writing_template === form.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-dark-100 bg-light-100 dark:bg-dark-100"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{form.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`font-bold text-base ${
                          project?.writing_template === form.value
                            ? "text-primary"
                            : "text-gray-900 dark:text-light-100"
                        }`}
                      >
                        {form.label}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200 mt-1">
                        {form.desc}
                      </Text>
                    </View>
                    {project?.writing_template === form.value && (
                      <Text className="text-primary text-lg">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowFormModal(false)}
                className="bg-light-100 dark:bg-dark-100 py-4 rounded-full mt-2"
              >
                <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Book Preview Modal */}
      <Modal
        visible={showBookPreview}
        animationType="slide"
        onRequestClose={() => setShowBookPreview(false)}
      >
        <View className="flex-1 bg-gray-900">
          <View className="px-6 pt-16 pb-4 bg-black/50">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setShowBookPreview(false)}
                className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
              >
                <Text className="text-xl text-white">✕</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-white">
                Poetry Preview
              </Text>
              <View className="w-10" />
            </View>
          </View>

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
            {poems.map((poem, index) => (
              <View
                key={poem.id}
                className="px-8 py-12 justify-center"
                style={{ width }}
              >
                <View
                  className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-2xl"
                  style={{ height: width * 1.2 }}
                >
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
                    {poem.name}
                  </Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-base text-gray-800 dark:text-light-200 leading-7 font-serif text-center">
                      {poem.content || ""}
                    </Text>
                  </ScrollView>
                  <Text className="text-xs text-gray-500 dark:text-light-200 text-center mt-4">
                    Poem {index + 1} of {poems.length}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Page Indicator */}
          <View className="absolute bottom-8 left-0 right-0 items-center">
            <View className="bg-black/50 px-6 py-3 rounded-full">
              <Text className="text-white font-bold">
                {currentPage + 1} of {poems.length}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </Background>
  );
};

export default PoetryDetails;
