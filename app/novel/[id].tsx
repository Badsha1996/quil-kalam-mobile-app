import Background from "@/components/common/Background";
import {
  createCharacter,
  createFile,
  createFolder,
  createLocation,
  deleteFile,
  deleteFolder,
  exportProjectAsJSON,
  getCharactersByProject,
  getFilesByProject,
  getFoldersByProject,
  getLocationsByProject,
  getProject,
  getProjectStats,
  getPublishingSettings,
  getTemplateStages,
  updateFile,
  updateProject,
} from "@/utils/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const NovelDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [templateStages, setTemplateStages] = useState<any[]>([]);
  const [publishingSettings, setPublishingSettingsState] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    "content" | "characters" | "locations" | "template" | "publish"
  >("content");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<any[]>([]);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState<"folder" | "file">("file");

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
    const charactersData = getCharactersByProject(projectId);
    const locationsData = getLocationsByProject(projectId);
    const stagesData = getTemplateStages(projectId);
    const publishData = getPublishingSettings(projectId);

    setProject(projectData);
    setStats(statsData);
    setFolders(foldersData);
    setFiles(filesData);
    setCharacters(charactersData);
    setLocations(locationsData);
    setTemplateStages(stagesData);
    setPublishingSettingsState(publishData);
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

  const getCurrentFolderItems = () => {
    const currentFolders = folders.filter(
      (f) => f.parent_folder_id === currentFolder
    );
    const currentFiles = files.filter((f) => f.folder_id === currentFolder);
    return { folders: currentFolders, files: currentFiles };
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      if (newItemType === "folder") {
        createFolder({
          projectId,
          parentFolderId: currentFolder || undefined,
          name: newItemName,
          folderType: "chapter",
          orderIndex: folders.length,
        });
      } else {
        createFile({
          projectId,
          folderId: currentFolder || undefined,
          fileType: "document",
          name: newItemName,
          content: newItemContent,
          orderIndex: files.length,
        });
      }

      setShowAddModal(false);
      setNewItemName("");
      setNewItemContent("");
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to create item");
    }
  };

  const handleFolderClick = (folder: any) => {
    setCurrentFolder(folder.id);
    setFolderPath([...folderPath, folder]);
  };

  const handleBackClick = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolder(
        newPath.length > 0 ? newPath[newPath.length - 1].id : null
      );
    }
  };

  const handleEditFile = (file: any) => {
    setEditingItem(file);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    try {
      updateFile(editingItem.id, {
        name: editingItem.name,
        content: editingItem.content,
      });
      setEditingItem(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to update file");
    }
  };

  const handleDeleteItem = (
    type: "file" | "folder",
    id: number,
    name: string
  ) => {
    Alert.alert(`Delete ${type}`, `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          try {
            if (type === "file") {
              deleteFile(id);
            } else {
              deleteFolder(id);
            }
            loadProjectData();
          } catch (error) {
            Alert.alert("Error", `Failed to delete ${type}`);
          }
        },
      },
    ]);
  };

  const handleAddCharacter = () => {
    Alert.prompt("Add Character", "Enter character name", (text) => {
      if (text && text.trim()) {
        createCharacter(projectId, { name: text });
        loadProjectData();
      }
    });
  };

  const handleAddLocation = () => {
    Alert.prompt("Add Location", "Enter location name", (text) => {
      if (text && text.trim()) {
        createLocation(projectId, { name: text });
        loadProjectData();
      }
    });
  };

  const handleExport = () => {
    try {
      const jsonData = exportProjectAsJSON(projectId);
      if (jsonData) {
        Alert.alert("Export Ready", "Project exported successfully!");
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

  const { folders: currentFolders, files: currentFiles } =
    getCurrentFolderItems();

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Minimizable Header */}
          <Animated.View
            style={{
              height: headerHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [80, 500],
              }),
              marginBottom: 20,
            }}
          >
            <View className="px-6 pt-16 pb-6">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
                >
                  <Text className="text-xl dark:text-light-100">←</Text>
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

              {!isHeaderMinimized && (
                <>
                  <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg mb-4">
                    <View className="flex-row items-start mb-4">
                      <View className="w-16 h-16 rounded-xl bg-secondary dark:bg-transparent justify-center items-center mr-4">
                        <Text className="text-4xl">📖</Text>
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
                        </View>
                      </View>
                    </View>

                    {project.description && (
                      <Text className="text-sm text-gray-600 dark:text-light-200 mb-4">
                        {project.description}
                      </Text>
                    )}

                    {/* Stats Grid */}
                    <View className="flex-row flex-wrap gap-3 mb-4">
                      <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                        <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                          Chapters
                        </Text>
                        <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                          {stats?.folderCount || 0}
                        </Text>
                      </View>
                      <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                        <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                          Files
                        </Text>
                        <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                          {stats?.fileCount || 0}
                        </Text>
                      </View>
                      <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                        <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                          Characters
                        </Text>
                        <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                          {stats?.characterCount || 0}
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

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mb-10">
                    <TouchableOpacity
                      onPress={() => setShowAddModal(true)}
                      className="flex-1 bg-secondary py-4 rounded-2xl shadow-lg"
                    >
                      <Text className="text-gray-900 dark:text-dark-300 font-bold text-center">
                        ➕ Add Content
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleExport}
                      className="bg-white dark:bg-dark-200 py-4 px-6 rounded-2xl border-2 border-primary shadow-lg"
                    >
                      <Text className="text-primary font-bold text-center">
                        📤
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* Tabs */}
          <View className="p-6 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {[
                  { key: "content", label: "Content", icon: "📝" },
                  { key: "characters", label: "Characters", icon: "👥" },
                  { key: "locations", label: "Locations", icon: "🗺️" },
                  ...(project.writing_template !== "freeform"
                    ? [{ key: "template", label: "Structure", icon: "📋" }]
                    : []),
                  { key: "publish", label: "Publish", icon: "📚" },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key as any)}
                    className={`px-5 py-3 rounded-full ${
                      activeTab === tab.key
                        ? "bg-primary"
                        : "bg-white dark:bg-dark-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        activeTab === tab.key
                          ? "text-white dark:text-dark-100"
                          : "text-gray-600 dark:text-light-200"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View className="px-6">
            {activeTab === "content" && (
              <View>
                {/* Breadcrumb Navigation */}
                {folderPath.length > 0 && (
                  <View className="mb-4">
                    {/* <TouchableOpacity
                      onPress={handleBackClick}
                      className="flex-row items-center mb-2"
                    >
                      <Text className="text-primary text-xl font-bold">
                        Back
                      </Text>
                    </TouchableOpacity> */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            setCurrentFolder(null);
                            setFolderPath([]);
                          }}
                        >
                          <Text className="text-gray-600 text-3xl dark:text-light-200 font-semibold">
                            Root
                          </Text>
                        </TouchableOpacity>
                        {folderPath.map((folder, index) => (
                          <View
                            key={folder.id}
                            className="flex-row items-center gap-2"
                          >
                            <Text className="text-gray-400 text-3xl dark:text-light-200">
                              ›
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                const newPath = folderPath.slice(0, index + 1);
                                setFolderPath(newPath);
                                setCurrentFolder(folder.id);
                              }}
                            >
                              <Text className="text-gray-600 text-3xl dark:text-light-200 font-semibold">
                                {folder.name}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Folders */}
                {currentFolders.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
                      Folders
                    </Text>
                    {currentFolders.map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        onPress={() => handleFolderClick(folder)}
                        onLongPress={() =>
                          handleDeleteItem("folder", folder.id, folder.name)
                        }
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 rounded-xl  justify-center items-center mr-3">
                              <Text className="text-3xl">📁</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                                {folder.name}
                              </Text>
                              <Text className="text-xs text-gray-500 dark:text-light-200 capitalize">
                                {folder.folder_type}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-400 dark:text-light-200 text-xl">
                            ›
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Files */}
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-3">
                  Documents ({currentFiles.length})
                </Text>
                {currentFiles.length > 0 ? (
                  currentFiles.map((file) => (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => handleEditFile(file)}
                      onLongPress={() =>
                        handleDeleteItem("file", file.id, file.name)
                      }
                      className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-100 justify-center items-center mr-3">
                            <Text className="text-xl">📄</Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-base font-bold text-gray-900 dark:text-light-100"
                              numberOfLines={1}
                            >
                              {file.name}
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              {file.word_count} words
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-400 dark:text-light-200">
                          ›
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="bg-white dark:bg-dark-200 rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">📝</Text>
                    <Text className="text-gray-600 dark:text-light-200">
                      No documents here yet
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "characters" && (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                    Characters ({characters.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddCharacter}
                    className="bg-secondary px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-dark-300 font-bold text-sm">
                      + Add
                    </Text>
                  </TouchableOpacity>
                </View>
                {characters.length > 0 ? (
                  characters.map((char) => (
                    <View
                      key={char.id}
                      className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-primary justify-center items-center mr-3">
                          <Text className="text-2xl">👤</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                            {char.name}
                          </Text>
                          {char.role && (
                            <Text className="text-sm text-gray-600 dark:text-light-200 capitalize">
                              {char.role}
                            </Text>
                          )}
                        </View>
                      </View>
                      {char.description && (
                        <Text className="text-sm text-gray-600 dark:text-light-200 mt-3">
                          {char.description}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View className="bg-white dark:bg-dark-200 rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">👥</Text>
                    <Text className="text-gray-600 dark:text-light-200">
                      No characters yet
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "locations" && (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                    Locations ({locations.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddLocation}
                    className="bg-secondary px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-dark-300 font-bold text-sm">
                      + Add
                    </Text>
                  </TouchableOpacity>
                </View>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <View
                      key={loc.id}
                      className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mr-3">
                          <Text className="text-2xl">📍</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                            {loc.name}
                          </Text>
                        </View>
                      </View>
                      {loc.description && (
                        <Text className="text-sm text-gray-600 dark:text-light-200 mt-3">
                          {loc.description}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View className="bg-white dark:bg-dark-200 rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">🗺️</Text>
                    <Text className="text-gray-600 dark:text-light-200">
                      No locations yet
                    </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "template" && templateStages.length > 0 && (
              <View>
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4">
                  {project.writing_template.replace("_", " ").toUpperCase()}
                </Text>
                {templateStages.map((stage, index) => (
                  <View
                    key={stage?.id || index}
                    className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-lg"
                  >
                    <View className="flex-row items-start">
                      <View className="w-8 h-8 rounded-full bg-primary justify-center items-center mr-3">
                        <Text className="text-white dark:text-dark-100 font-bold text-sm">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-1">
                          {String(stage?.stage_name ?? "")}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-light-200">
                          {String(stage?.stage_description ?? "")}
                        </Text>
                        {stage?.is_completed ? (
                          <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full mt-2 self-start">
                            <Text className="text-green-700 dark:text-green-200 text-xs font-bold">
                              ✓ Completed
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === "publish" && (
              <View>
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4">
                  Publishing Information
                </Text>
                <View className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-lg">
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      ISBN
                    </Text>
                    <Text className="text-base text-gray-900 dark:text-light-200">
                      {publishingSettings?.isbn || "Not set"}
                    </Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Publisher
                    </Text>
                    <Text className="text-base text-gray-900 dark:text-light-200">
                      {publishingSettings?.publisher || "Not set"}
                    </Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Export Format
                    </Text>
                    <Text className="text-base text-gray-900 dark:text-light-200 uppercase">
                      {publishingSettings?.export_format || "PDF"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Coming Soon",
                        "Publishing settings editor will be added soon"
                      )
                    }
                    className="bg-primary py-3 rounded-full mt-4"
                  >
                    <Text className="text-white dark:text-dark-100 font-bold text-center">
                      Edit Publishing Info
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Add Content Modal */}
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
          <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 max-h-[90%]">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4">
              Add New Content
            </Text>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setNewItemType("file")}
                className={`flex-1 py-3 rounded-2xl ${
                  newItemType === "file"
                    ? "bg-primary"
                    : "bg-light-100 dark:bg-dark-100"
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    newItemType === "file"
                      ? "text-white dark:text-dark-100"
                      : "text-gray-600 dark:text-light-200"
                  }`}
                >
                  📄 Document
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewItemType("folder")}
                className={`flex-1 py-3 rounded-2xl ${
                  newItemType === "folder"
                    ? "bg-primary"
                    : "bg-light-100 dark:bg-dark-100"
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    newItemType === "folder"
                      ? "text-white dark:text-dark-100"
                      : "text-gray-600 dark:text-light-200"
                  }`}
                >
                  📁 Folder
                </Text>
              </TouchableOpacity>
            </View>

            {folderPath.length > 0 && (
              <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 mb-4">
                <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                  Creating in:
                </Text>
                <Text className="text-sm font-semibold text-gray-900 dark:text-light-100">
                  {folderPath.map((f) => f.name).join(" › ")}
                </Text>
              </View>
            )}

            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder={`Enter ${newItemType} name...`}
              placeholderTextColor="#9CA3AF"
              className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
            />

            {newItemType === "file" && (
              <ScrollView style={{ maxHeight: 200 }} className="mb-4">
                <TextInput
                  value={newItemContent}
                  onChangeText={setNewItemContent}
                  placeholder="Start writing... (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100"
                  style={{ minHeight: 150 }}
                />
              </ScrollView>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName("");
                  setNewItemContent("");
                }}
                className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
              >
                <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddItem}
                className="flex-1 bg-secondary py-4 rounded-full"
              >
                <Text className="text-gray-900 dark:text-dark-300 font-bold text-center">
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Enhanced Edit File Modal with Focus Mode */}
      <Modal
        visible={!!editingItem}
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white dark:bg-dark-300"
        >
          <View className="px-6 pt-16 pb-6 flex-1">
            {/* Editor Header */}
            {!isFocusMode && (
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setEditingItem(null)}
                  className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                >
                  <Text className="text-xl dark:text-light-100">✕</Text>
                </TouchableOpacity>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setIsFocusMode(true)}
                    className="bg-light-100 dark:bg-dark-200 px-4 py-3 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-light-100 font-bold">
                      🎯 Focus
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    className="bg-secondary px-6 py-3 rounded-full"
                  >
                    <Text className="text-gray-900 dark:text-dark-300 font-bold">
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Focus Mode Toggle */}
            {isFocusMode && (
              <TouchableOpacity
                onPress={() => setIsFocusMode(false)}
                className="absolute top-16 right-6 z-10 bg-primary px-4 py-2 rounded-full shadow-lg"
              >
                <Text className="text-white dark:text-dark-100 text-xs font-bold">
                  Exit Focus
                </Text>
              </TouchableOpacity>
            )}

            {!isFocusMode && (
              <TextInput
                value={editingItem?.name}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, name: text })
                }
                placeholder="Document name"
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-200 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-lg font-bold"
              />
            )}

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <TextInput
                value={editingItem?.content}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, content: text })
                }
                placeholder="Start writing your story..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className={`${
                  isFocusMode
                    ? "bg-transparent"
                    : "bg-white dark:bg-dark-200 rounded-2xl"
                } px-4 py-4 text-gray-900 dark:text-light-100 text-base leading-7`}
                style={{ minHeight: 400, fontSize: isFocusMode ? 18 : 16 }}
                autoFocus={isFocusMode}
              />

              {!isFocusMode && (
                <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mt-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600 dark:text-light-200">
                      Word Count:{" "}
                      {editingItem?.content?.trim().split(/\s+/).filter(Boolean)
                        .length || 0}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-light-200">
                      Characters: {editingItem?.content?.length || 0}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Background>
  );
};

export default NovelDetails;
