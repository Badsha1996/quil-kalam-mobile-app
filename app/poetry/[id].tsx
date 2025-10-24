import Background from "@/components/common/Background";
import {
  colorThemes,
  poetryForms,
  prompts,
  writingThemes,
} from "@/constants/poetryDetails";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
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
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

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
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showRhymeHelper, setShowRhymeHelper] = useState(false);
  const [rhymeWord, setRhymeWord] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const autoSaveTimer = useRef<any>(null);

  useEffect(() => {
    loadProjectData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  useEffect(() => {
    if (autoSaveEnabled && editingPoem) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editingPoem?.content, autoSaveEnabled]);

  const handleAutoSave = () => {
    if (!editingPoem) return;
    try {
      updateFile(editingPoem.id, {
        name: editingPoem.name,
        content: editingPoem.content,
      });
      loadProjectData();
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

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
      Alert.alert("Saved", "Your poem has been saved! ✨");
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
    // @ts-ignore
    updateProject(projectId, { writing_template: formType });
    loadProjectData();
    setShowFormModal(false);
  };

  // Poetry Analysis Functions
  const countLines = (text: string) => {
    if (!text) return 0;
    return text.split("\n").filter((line) => line.trim()).length;
  };

  const countStanzas = (text: string) => {
    if (!text) return 0;
    return text.split(/\n\s*\n/).filter((stanza) => stanza.trim()).length;
  };

  const countSyllables = (word: string) => {
    if (!word) return 0;
    word = word.toLowerCase().trim();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  };

  const analyzeSyllablesPerLine = (text: string) => {
    if (!text) return [];
    return text.split("\n").map((line) => {
      const words = line.trim().split(/\s+/);
      return words.reduce((sum, word) => sum + countSyllables(word), 0);
    });
  };

  const detectRhymeScheme = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n").filter((line) => line.trim());
    const lastWords = lines.map((line) => {
      const words = line.trim().split(/\s+/);
      return (
        words[words.length - 1]?.toLowerCase().replace(/[.,!?;:]/, "") || ""
      );
    });

    const rhymeMap = new Map();
    let currentLetter = 65; // 'A'
    const scheme: string[] = [];

    lastWords.forEach((word) => {
      if (!word) {
        scheme.push("X");
        return;
      }

      let found = false;
      for (const [key, value] of rhymeMap) {
        if (wordsRhyme(key, word)) {
          scheme.push(value);
          found = true;
          break;
        }
      }

      if (!found) {
        const letter = String.fromCharCode(currentLetter);
        rhymeMap.set(word, letter);
        scheme.push(letter);
        currentLetter++;
      }
    });

    return scheme.join("");
  };

  const wordsRhyme = (word1: string, word2: string) => {
    if (!word1 || !word2 || word1 === word2) return false;
    const ending1 = word1.slice(-3);
    const ending2 = word2.slice(-3);
    return ending1 === ending2 || word1.slice(-2) === word2.slice(-2);
  };

  const getReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(words / 100); // Slower reading for poetry
  };

  const exportToFormat = (format: "txt" | "pdf" | "image") => {
    const content = poems
      .map((p) => `${p.name}\n\n${p.content}\n\n`)
      .join("\n---\n\n");

    Alert.alert(
      "Export Ready",
      `Your poetry collection is ready to export as ${format.toUpperCase()}!`,
      [{ text: "OK" }]
    );
    console.log("Export content:", content);
  };

  const generateInspiration = () => {
    return prompts[Math.floor(Math.random() * prompts.length)];
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
        onPress={() => setShowInspirationModal(true)}
        className="bg-white dark:bg-dark-200 px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
          💡 Inspire
        </Text>
      </TouchableOpacity>
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
              outputRange: [80, 450],
            }),
          }}
        >
          <View className="px-6 pt-16">
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
                        <Text className="text-white text-xs font-bold">
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

                {/* Enhanced Stats Grid */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  <View className="bg-gradient-to-br from-purple-100 to-purple-50 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-purple-600 dark:text-light-200 mb-1">
                      Total Poems
                    </Text>
                    <Text className="text-xl font-bold text-purple-900 dark:text-light-100">
                      {poems.length}
                    </Text>
                  </View>
                  <View className="bg-gradient-to-br from-pink-100 to-pink-50 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-pink-600 dark:text-light-200 mb-1">
                      Collections
                    </Text>
                    <Text className="text-xl font-bold text-pink-900 dark:text-light-100">
                      {folders.length}
                    </Text>
                  </View>
                  <View className="bg-gradient-to-br from-blue-100 to-blue-50 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-blue-600 dark:text-light-200 mb-1">
                      Total Lines
                    </Text>
                    <Text className="text-xl font-bold text-blue-900 dark:text-light-100">
                      {poems.reduce(
                        (sum, p) => sum + countLines(p.content || ""),
                        0
                      )}
                    </Text>
                  </View>
                  <View className="bg-gradient-to-br from-green-100 to-green-50 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-green-600 dark:text-light-200 mb-1">
                      Total Stanzas
                    </Text>
                    <Text className="text-xl font-bold text-green-900 dark:text-light-100">
                      {poems.reduce(
                        (sum, p) => sum + countStanzas(p.content || ""),
                        0
                      )}
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
                        Target: {project.target_word_count.toLocaleString()}{" "}
                        words
                      </Text>
                    </View>
                    <View className="h-3 bg-light-100 dark:bg-dark-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
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
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }} className="px-6 py-6">
            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-secondary py-4 rounded-2xl shadow-lg"
              >
                <Text className="text-gray-900 justify-center items-center  font-bold text-center">
                  New Poem
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
                onPress={() => setShowExportModal(true)}
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
                  📚 Collections
                </Text>
                {folders.map((collection) => {
                  const collectionPoems = poems.filter(
                    (p) => p.folder_id === collection.id
                  );
                  const totalWords = collectionPoems.reduce(
                    (sum, p) => sum + (p.word_count || 0),
                    0
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
                          <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 justify-center items-center mr-3">
                            <Text className="text-2xl">📖</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                              {collection.name}
                            </Text>
                            <View className="flex-row gap-3 mt-1">
                              <Text className="text-xs text-gray-500 dark:text-light-200">
                                {collectionPoems.length}{" "}
                                {collectionPoems.length === 1
                                  ? "poem"
                                  : "poems"}
                              </Text>
                              <Text className="text-xs text-gray-500 dark:text-light-200">
                                • {totalWords.toLocaleString()} words
                              </Text>
                            </View>
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
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                  ✍️ All Poems ({poems.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowThemeModal(true)}
                  className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-xs font-semibold text-gray-600 dark:text-light-200">
                    🎨 Theme
                  </Text>
                </TouchableOpacity>
              </View>

              {poems.length > 0 ? (
                poems.map((poem, index) => {
                  const lines = countLines(poem.content || "");
                  const stanzas = countStanzas(poem.content || "");
                  const readingTime = getReadingTime(poem.content || "");

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
                          <View className="flex-row gap-3 flex-wrap">
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
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              ⏱️ {readingTime}m read
                            </Text>
                          </View>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary justify-center items-center">
                          <Text className="text-white font-bold text-xs">
                            {index + 1}
                          </Text>
                        </View>
                      </View>

                      {poem.content && (
                        <View className="bg-gradient-to-br from-light-100 to-light-50 dark:bg-dark-100 rounded-xl p-3 border-l-4 border-primary">
                          <Text
                            className="text-sm text-gray-700 dark:text-light-200 italic leading-6 font-serif"
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
                <View className="bg-gradient-to-br from-white to-light-100 dark:bg-dark-200 rounded-2xl p-10 items-center">
                  <Text className="text-6xl mb-3">✍️</Text>
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
                    No poems yet
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200 text-center mb-4">
                    Let your creativity flow, start writing your first verse
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-secondary to-pink-200 px-6 py-3 rounded-full shadow-lg"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold">
                      ✨ Write Your First Poem
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View
            className="bg-white dark:bg-dark-200 rounded-t-3xl p-6"
            style={{ maxHeight: "95%" }}
          >
            <Text className="text-2xl font-bold items-center justify-center text-gray-900 dark:text-light-100 mb-4">
              New Poem
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={newPoemTitle}
                onChangeText={setNewPoemTitle}
                placeholder="Untitled Poem"
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-lg font-bold"
              />

              {project.writing_template &&
                project.writing_template !== "freeform" && (
                  <View className="bg-blue-50 dark:bg-dark-100 rounded-2xl p-3 mb-4">
                    <Text className="text-sm text-blue-600 dark:text-light-200 font-semibold mb-1">
                      📖{" "}
                      {
                        poetryForms.find(
                          (f) => f.value === project.writing_template
                        )?.label
                      }{" "}
                      Guide
                    </Text>
                    <Text className="text-xs text-blue-500 dark:text-light-200">
                      {
                        poetryForms.find(
                          (f) => f.value === project.writing_template
                        )?.guide
                      }
                    </Text>
                  </View>
                )}

              <TextInput
                value={newPoemContent}
                onChangeText={setNewPoemContent}
                placeholder="Write your verses here...&#10;&#10;Press return twice for stanzas&#10;&#10;Let your heart guide your words"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100 font-serif text-base leading-7"
                style={{ minHeight: 300 }}
              />

              {newPoemContent && (
                <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 mt-3 mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600 dark:text-light-200">
                      Words:{" "}
                      {
                        newPoemContent.trim().split(/\s+/).filter(Boolean)
                          .length
                      }
                    </Text>
                    <Text className="text-xs text-gray-600 dark:text-light-200">
                      Lines: {countLines(newPoemContent)}
                    </Text>
                    <Text className="text-xs text-gray-600 dark:text-light-200">
                      Stanzas: {countStanzas(newPoemContent)}
                    </Text>
                  </View>
                </View>
              )}

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

              <View className="flex-row gap-3 mt-4">
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
                  className="flex-1 bg-gradient-to-r from-secondary to-pink-200 py-4 rounded-full shadow-lg"
                >
                  <Text className="text-gray-900 font-bold text-center">
                    Save Poem ✨
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Poem Modal */}
      <Modal
        visible={!!editingPoem}
        animationType="slide"
        onRequestClose={() => setEditingPoem(null)}
      >
        <View
          className="flex-1"
          style={{
            backgroundColor: zenMode ? selectedTheme.bg : "#F9FAFB",
          }}
        >
          {!zenMode && (
            <View className="px-6 pt-16 pb-4 border-b border-gray-200 dark:border-dark-100 bg-white dark:bg-dark-300">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setEditingPoem(null)}
                  className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                >
                  <Text className="text-xl dark:text-light-100">✕</Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setShowAnalysisModal(true)}
                    className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                  >
                    <Text className="text-lg">📊</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowRhymeHelper(!showRhymeHelper)}
                    className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                  >
                    <Text className="text-lg">🎵</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowThemeModal(true)}
                    className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                  >
                    <Text className="text-lg">🎨</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setZenMode(!zenMode)}
                    className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                  >
                    <Text className="text-lg">{zenMode ? "📝" : "🧘"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSavePoem}
                    className="bg-gradient-to-r from-secondary to-pink-200 px-4 py-2 rounded-full shadow-lg"
                  >
                    <Text className="text-gray-900 font-bold text-sm">
                      💾 Save
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
                className="bg-light-100 dark:bg-dark-200 rounded-2xl px-4 py-3 text-gray-900 dark:text-light-100 text-xl font-bold mb-2"
              />

              {autoSaveEnabled && (
                <Text className="text-xs text-green-600 dark:text-green-400 text-center">
                  ✓ Auto-saving every 3 seconds
                </Text>
              )}
            </View>
          )}

          {zenMode && (
            <TouchableOpacity
              onPress={() => setZenMode(false)}
              className="absolute top-12 right-6 z-50 w-10 h-10 rounded-full bg-black/20 justify-center items-center"
            >
              <Text className="text-white text-lg">✕</Text>
            </TouchableOpacity>
          )}

          {showRhymeHelper && !zenMode && (
            <View className="bg-blue-50 dark:bg-dark-100 px-6 py-3">
              <Text className="text-sm font-semibold text-blue-600 dark:text-light-200 mb-2">
                🎵 Rhyme Helper
              </Text>
              <TextInput
                value={rhymeWord}
                onChangeText={setRhymeWord}
                placeholder="Enter a word to find rhymes..."
                placeholderTextColor="#9CA3AF"
                className="bg-white dark:bg-dark-200 rounded-xl px-3 py-2 text-gray-900 dark:text-light-100 text-sm"
              />
              {rhymeWord && (
                <Text className="text-xs text-blue-500 dark:text-light-200 mt-2">
                  Tip: Try words ending in similar sounds!
                </Text>
              )}
            </View>
          )}

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: zenMode ? 40 : 20,
              paddingVertical: zenMode ? 60 : 20,
              alignItems: "center",
            }}
            style={{ backgroundColor: selectedTheme.bg }}
          >
            <View
              style={{
                width: zenMode ? Math.min(650, width - 80) : "100%",
                maxWidth: 700,
              }}
            >
              <TextInput
                value={editingPoem?.content || ""}
                onChangeText={(text) =>
                  setEditingPoem({ ...editingPoem, content: text })
                }
                placeholder="Pour your heart onto the page...&#10;&#10;Every line is a breath&#10;Every stanza is a thought&#10;&#10;Let the words find you"
                placeholderTextColor={selectedTheme.text + "80"}
                multiline
                textAlignVertical="top"
                className="text-gray-900 dark:text-light-100"
                style={{
                  minHeight: height - 300,
                  fontSize: 18,
                  lineHeight: 32,
                  fontFamily: "serif",
                  color: selectedTheme.text,
                  backgroundColor: selectedTheme.bg,
                  padding: zenMode ? 40 : 16,
                }}
              />
            </View>
          </ScrollView>

          {!zenMode && (
            <View className="bg-white dark:bg-dark-300 border-t border-gray-200 dark:border-dark-100 px-6 py-3">
              <View className="flex-row justify-between items-center flex-wrap gap-2">
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
                <Text className="text-sm text-gray-600 dark:text-light-200">
                  Reading: {getReadingTime(editingPoem?.content || "")}m
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-4">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[85%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                📊 Poem Analysis
              </Text>
              <TouchableOpacity
                onPress={() => setShowAnalysisModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-100 justify-center items-center"
              >
                <Text className="text-gray-600 dark:text-light-200">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editingPoem && (
                <>
                  <View className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 mb-4">
                    <Text className="text-white text-sm mb-1">Total Words</Text>
                    <Text className="text-white text-4xl font-bold">
                      {editingPoem.content?.trim().split(/\s+/).filter(Boolean)
                        .length || 0}
                    </Text>
                  </View>

                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                      <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                        Lines
                      </Text>
                      <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                        {countLines(editingPoem.content || "")}
                      </Text>
                    </View>

                    <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                      <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                        Stanzas
                      </Text>
                      <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                        {countStanzas(editingPoem.content || "")}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3">
                    <Text className="text-gray-600 dark:text-light-200 text-sm mb-2">
                      Rhyme Scheme
                    </Text>
                    <Text className="text-gray-900 dark:text-light-100 text-xl font-bold font-mono">
                      {detectRhymeScheme(editingPoem.content || "") ||
                        "No pattern detected"}
                    </Text>
                  </View>

                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3">
                    <Text className="text-gray-600 dark:text-light-200 text-sm mb-2">
                      Syllables Per Line
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {analyzeSyllablesPerLine(editingPoem.content || "")
                        .slice(0, 10)
                        .map((count, i) => (
                          <View
                            key={i}
                            className="bg-white dark:bg-dark-200 px-3 py-1 rounded-full"
                          >
                            <Text className="text-xs font-semibold text-gray-900 dark:text-light-100">
                              L{i + 1}: {count}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>

                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3">
                    <Text className="text-gray-600 dark:text-light-200 text-sm mb-2">
                      Reading Time
                    </Text>
                    <Text className="text-gray-900 dark:text-light-100 text-xl font-bold">
                      {getReadingTime(editingPoem.content || "")} minutes
                    </Text>
                  </View>

                  <View className="bg-gradient-to-br from-purple-100 to-pink-100 dark:bg-dark-100 rounded-2xl p-4">
                    <Text className="text-purple-900 dark:text-light-100 text-sm font-semibold mb-2">
                      ✨ Poetic Insight
                    </Text>
                    <Text className="text-purple-700 dark:text-light-200 text-xs">
                      {countStanzas(editingPoem.content || "") > 1
                        ? "Your use of stanzas creates natural pauses and breathing room."
                        : "Consider breaking into stanzas to create rhythm and pacing."}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAnalysisModal(false)}
              className="bg-primary py-4 rounded-full mt-4"
            >
              <Text className="text-white font-bold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inspiration Modal */}
      <Modal
        visible={showInspirationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInspirationModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
              💡 Writing Inspiration
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-gradient-to-br from-purple-100 to-pink-100 dark:bg-dark-100 rounded-2xl p-4 mb-4">
                <Text className="text-sm font-semibold text-purple-900 dark:text-light-100 mb-2">
                  ✨ Random Prompt
                </Text>
                <Text className="text-purple-700 dark:text-light-200 italic">
                  "{generateInspiration()}"
                </Text>
                <TouchableOpacity
                  onPress={() => setShowInspirationModal(true)}
                  className="mt-3 bg-white dark:bg-dark-200 py-2 px-4 rounded-full self-start"
                >
                  <Text className="text-xs font-semibold text-purple-600 dark:text-light-200">
                    🔄 New Prompt
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                Explore Themes
              </Text>

              {writingThemes.map((theme, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3"
                  onPress={() => {
                    setNewPoemTitle(`${theme.name} - ${Date.now()}`);
                    setShowInspirationModal(false);
                    setShowAddModal(true);
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl mr-2">{theme.emoji}</Text>
                    <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                      {theme.name}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {theme.prompts.map((prompt, i) => (
                      <View
                        key={i}
                        className="bg-white dark:bg-dark-200 px-2 py-1 rounded-full"
                      >
                        <Text className="text-xs text-gray-600 dark:text-light-200">
                          {prompt}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowInspirationModal(false)}
                className="bg-light-100 dark:bg-dark-100 py-4 rounded-full mt-2"
              >
                <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Theme Selector Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
              🎨 Editor Theme
            </Text>

            <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
              Choose a theme that inspires your writing
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {colorThemes.map((theme, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedTheme(theme);
                    setShowThemeModal(false);
                  }}
                  className="mb-3 rounded-2xl overflow-hidden border-2"
                  style={{
                    borderColor:
                      selectedTheme.name === theme.name
                        ? theme.accent
                        : "#E5E7EB",
                  }}
                >
                  <View style={{ backgroundColor: theme.bg }} className="p-4">
                    <Text
                      style={{ color: theme.text }}
                      className="font-bold text-lg mb-2"
                    >
                      {theme.name}
                    </Text>
                    <View className="flex-row gap-2">
                      <View
                        style={{ backgroundColor: theme.accent }}
                        className="w-8 h-8 rounded-full"
                      />
                      <View
                        style={{ backgroundColor: theme.text + "40" }}
                        className="w-8 h-8 rounded-full"
                      />
                      <View
                        style={{ backgroundColor: theme.bg }}
                        className="w-8 h-8 rounded-full border border-gray-300"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
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

      {/* Poetry Form Modal - Enhanced */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[85%]">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
              🎨 Choose Poetry Form
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
                  <View className="flex-row items-start">
                    <Text className="text-3xl mr-3">{form.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`font-bold text-base mb-1 ${
                          project?.writing_template === form.value
                            ? "text-primary"
                            : "text-gray-900 dark:text-light-100"
                        }`}
                      >
                        {form.label}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200 mb-2">
                        {form.desc}
                      </Text>
                      {form.guide && (
                        <Text className="text-xs text-gray-500 dark:text-light-200 italic">
                          {form.guide}
                        </Text>
                      )}
                    </View>
                    {project?.writing_template === form.value && (
                      <Text className="text-primary text-2xl">✓</Text>
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
